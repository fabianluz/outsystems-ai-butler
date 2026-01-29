# 🤖 OutSystems AI Butler

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Stack](https://img.shields.io/badge/tech-React_|_TypeScript_|_DexieDB-green.svg)

**The missing link between Service Studio and Large Language Models.**

OutSystems AI Butler acts as a **"Digital Twin"** for your OutSystems environment (O11 or ODC). It bridges the gap between visual low-code development and text-based AI models (like ChatGPT, Claude, or DeepSeek).

By maintaining a structured mirror of your module's **Data Model** and **Logic Flows** locally, this tool allows you to:

1.  **Visualize** your code structure instantly.
2.  **Export** token-efficient, hallucination-free context for AI.
3.  **Import** AI-generated code back into your workflow using compatible XML schemas.

---

## 🌟 Why use this?

LLMs are great at writing code, but they often "hallucinate" (invent) variables or database tables that don't exist in your project.

- **Without Butler:** You say "Write a query for orders," and the AI guesses table names like `tbl_Orders` or `OrderHeader`.
- **With Butler:** You click **"✨ Copy for AI"**, paste the context, and the AI knows _exactly_ that you have an Entity named `Order` with an attribute `TotalAmount` of type `Currency`.

---

## 🚀 Features

### 📦 Context Management

- **Multi-Platform:** Support for both **O11 Modules** and **ODC Apps/Libraries**.
- **Local-First:** Data is stored in your browser's **IndexedDB**. Zero data leaves your machine unless you copy-paste it.

### 📄 Entity Manager (Data Layer)

- Define Database Entities manually or import them via XML.
- **Auto-ERD:** Automatically generates **Entity Relationship Diagrams** by detecting foreign key patterns (e.g., `CustomerId` links to `Customer`).

### ⚡ Logic Manager (Business Layer)

- Define Server Actions with full logic flow support.
- **Visual Flowchart:** Renders your logic (Ifs, Switches, Assignments, Loops) as an interactive diagram.
- **Pseudo-Code Export:** Converts visual nodes into structured JSON pseudo-code that LLMs can "read" and debug.

### 🤖 AI Integration

- **Smart Import:** Paste XML from an LLM to instantly create Entities and Actions.
- **Prompt Templates:** Built-in "Suggested Prompts" to teach the AI how to work with your specific app.
- **One-Click Context:** Generates a highly optimized JSON prompt of your entire module.

---

## 🛠️ Installation

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (included with Node.js)

### Steps

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/fabianluz/outsystems-ai-butler
    cd outsystems-ai-butler
    ```

2.  **Install Dependencies**

    ```bash
    npm install
    # Critical: Ensure graph libraries are installed
    npm install dagre @types/dagre @xyflow/react
    ```

3.  **Start the Application**

    ```bash
    npm run dev
    ```

4.  **Open in Browser**
    Navigate to `http://localhost:5173`.

---

## 📖 The "AI-First" Workflow

This application is designed to be used side-by-side with ChatGPT or Claude.

### Phase 1: Define Context (The Digital Twin)

1.  **Create a Project:** Define your application (e.g., "OrderManagement").
2.  **Create a Module:** Define the module you are working on (e.g., "Order_CS").
3.  **Populate Data:**
    - _Option A:_ Manually create Entities using the **"+ New Entity"** button.
    - _Option B (Recommended):_ Ask ChatGPT to generate the XML for you using the **"❓ Entity Guide"** prompt, then click **"📋 Import"**.

### Phase 2: Consult the AI

1.  Click the purple **✨ Copy for AI** button in the module header.
2.  Paste this JSON into ChatGPT.
3.  Ask your question:
    > "Based on the context I just provided, write a SQL query to find the top 5 Users by completed Task count."

### Phase 3: Import Solutions

1.  If the AI generates new Actions or Entities, ensure it uses the **XML Schema** (see below).
2.  Copy the XML block from the AI.
3.  Click **"📋 Import"** in the Butler app.
4.  Visualize the result in the **Diagram** view to verify logic.

---

## 📄 XML Import Schema Documentation

To make LLMs generate code compatible with this tool, use the **"💡 Suggested Prompts"** button in the app, or reference this schema.

### 1. Entities (Data Model)

Attributes: `Name`, `Description`, `IsPublic`.
Inner Tags: `Attributes` > `EntityAttribute`.

**Example:**

```xml
<Entity Name="Product" Description="Catalog">
    <Attributes>
        <EntityAttribute Name="Id" Type="LongInteger" IsIdentifier="true" />
        <EntityAttribute Name="SKU" Type="Text" IsMandatory="true" />
    </Attributes>
</Entity>
```
