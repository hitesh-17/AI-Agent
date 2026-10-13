# 🤖 Alex: A Local AI Agent with Tool Calling

A command-line AI agent built with Node.js. It runs a local LLM through [Ollama](https://ollama.com) and can chat normally or call tools (live weather, calculator) when a question needs them.

## 📖 About the Agent

Alex is a "senior dev" persona who explains things clearly. For each question, the agent:

1. Sends your message and the tool definitions to the model.
2. If the model requests a tool, runs it and feeds the result back.
3. Repeats until the model gives a final answer (max 5 steps).

It keeps the full conversation in memory for the session.

### Available Tools

| Tool | Description |
|------|-------------|
| `get_weather` | Current weather for any city (via Open-Meteo, no API key needed) |
| `calculate` | Add, subtract, multiply and divide two numbers |

## 🧱 Tech Stack

- **Runtime:** Node.js 18+
- **LLM:** Ollama (`llama3.2`)
- **SDK:** [`openai`](https://www.npmjs.com/package/openai) (OpenAI-compatible endpoint)
- **Config:** [`dotenv`](https://www.npmjs.com/package/dotenv)
- **Weather data:** [Open-Meteo](https://open-meteo.com)

## 🚀 Installation

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 2. Install dependencies

```bash
npm install openai dotenv
```

### 3. Enable ES modules

Add this to your `package.json`:

```json
{
  "type": "module"
}
```

### 4. Install Ollama and pull the model

Download Ollama from [ollama.com/download](https://ollama.com/download), then run:

```bash
ollama pull llama3.2
```

### 5. Create a `.env` file

```env
OPENAI_API_KEY=ollama
```

### 6. Run the agent

```bash
node index.js
```

Type `exit` to quit.
