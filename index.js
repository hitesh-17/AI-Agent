import { OpenAI } from "openai";
import { config } from "dotenv";
import rl from "readline/promises";

const readline = rl.createInterface({
  input: process.stdin,
  output: process.stdout,
});

config();

const model = new OpenAI({
  baseURL: "http://localhost:11434/v1",
  apikey: process.env.OPENAI_API_KEY,
});

// -------------------------------------------tools------
// -------get_weather
async function get_weather({ city }) {
  // Step 1: Find the city's coordinates
  const geoUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");

  geoUrl.searchParams.set("name", city);
  geoUrl.searchParams.set("count", "1");
  geoUrl.searchParams.set("language", "en");
  geoUrl.searchParams.set("format", "json");

  const geoResponse = await fetch(geoUrl);
  if (!geoResponse.ok) throw new Error("Geocoding failed");

  const geoData = await geoResponse.json();
  const place = geoData.results?.[0];

  if (!place) {
    return { error: `City "${city}" was not found.` };
  }

  // Step 2: Get the current weather
  const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");

  weatherUrl.searchParams.set("latitude", place.latitude);
  weatherUrl.searchParams.set("longitude", place.longitude);
  weatherUrl.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
  );

  const weatherResponse = await fetch(weatherUrl);
  if (!weatherResponse.ok) throw new Error("Weather request failed");

  const weatherData = await weatherResponse.json();

  return {
    city: place.name,
    country: place.country,
    temperature: weatherData.current.temperature_2m,
    humidity: weatherData.current.relative_humidity_2m,
    windSpeed: weatherData.current.wind_speed_10m,
    weatherCode: weatherData.current.weather_code,
    units: weatherData.current_units,
  };
}

// ------ calculate -----
async function calculate({ a, b, operation }) {
  switch (operation) {
    case "add":
      return a + b;
    case "subtract":
      return a - b;
    case "multiply":
      return a * b;
    case "divide":
      if (b === 0) throw new Error("Cannot divide by zero");
      return a / b;
    default:
      throw new Error("Unsupported operation");
  }
}

const toolImplementations = { get_weather, calculate };

const tools = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description:
        "Get current weather for a city. Use this when the user asks about current weather.",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "City name, for example Mumbai or London",
          },
        },
        required: ["city"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate",
      description: "Calculate two numbers using a mathematical operation.",
      parameters: {
        type: "object",
        properties: {
          a: { type: "number", description: "First number" },
          b: { type: "number", description: "Second number" },
          operation: {
            type: "string",
            enum: ["add", "subtract", "multiply", "divide"],
          },
        },
        required: ["a", "b", "operation"],
        additionalProperties: false,
      },
    },
  },
];

const messages = [
  {
    role: "system",
    content:
      "your name is alex, senior dev, how explain the things" +
      "You are a helpful chatbot. Use tools only when needed; otherwise just answer normally.",
  },
];

async function runAgent() {
  const MAX_LIMIT = 5;
  for (let step = 0; step < MAX_LIMIT; step++) {
    const response = await model.chat.completions.create({
      model: "llama3.2",
      messages: messages,
      tools,
    });

    const msg = response.choices[0].message;
    messages.push(msg);

    if (!msg.tool_calls?.length) {
      return msg.content;
    }

    for await (const call of msg.tool_calls) {
      const fn = toolImplementations[call.function.name];
      let result;
      try {
        result = fn
          ? await fn(JSON.parse(call.function.arguments))
          : { error: `unkown-tool : ${call.function.name}` };
      } catch (error) {
        result = { error: error.message };
      }

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }
  return "Sorry, I took too many steps without finishing.";
}

try {
  while (true) {
    const userPrompt = await readline.question("user : ");
    if (userPrompt.toLowerCase() === "exit") break;

    messages.push({ role: "user", content: userPrompt });

    const answer = await runAgent();
    console.log("Assistant :", answer, "\n");
  }
} catch (error) {
  console.log(error.message);
} finally {
  readline.close();
}

/**
 *  automate the reply for simple promt
 */

// while(true){
//     const userPrompt = await readline.question("user : ")
//     if (userPrompt.toLowerCase() === "exit") break;

//     messages.push({role:"user",content:userPrompt})

//     const response = await model.chat.completions.create({
//       model: "llama3.2",
//       messages : messages,
//       tools,
//       stream: true,
//     });

//     process.stdout.write("Assistant : ")

//     let assistantReply ="";
//     for await (const chunks of response){
//         const context = chunks.choices[0]?.delta?.content;
//         if(context){
//             process.stdout.write(context);
//             assistantReply += context;
//         }
//     }
//     messages.push({
//         role:"assistant",
//         content : assistantReply,
//         tools
//     })
//     console.log();
//     // console.log('store message',messages)
// }

// const response = await model.chat.completions.create({
//   model: "llama3.2",
//   messages: [
//     { role: "system", content: "you are working as a chat Bot" },
//     { role: "user", content: "Tell me value of 2+2 and how did you get it ??" },
//   ],
//   stream: true,
// });

// for await (const event of response) {
//   const context = event.choices[0]?.delta?.content;
//   if (context) {
//     process.stdout.write(context);
//   }
// }
// console.log();
