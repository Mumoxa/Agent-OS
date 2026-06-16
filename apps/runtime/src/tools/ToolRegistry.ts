import { AgentToolRequest } from '../types.js';

export interface Tool {
  name: string;
  description: string;
  required_permissions: string[];
  approval_threshold: 'none' | 'low' | 'medium' | 'high';
  handler: (args: Record<string, any>, context: ToolContext) => Promise<any>;
}

export interface ToolContext {
  agent_id: string;
  org_id: string;
  run_id: string;
  log: (message: string) => void;
}

export class ToolRegistry {
  private tools = new Map<string, Tool>();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  list(): Tool[] {
    return Array.from(this.tools.values());
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  async execute(
    toolName: string,
    args: Record<string, any>,
    context: ToolContext
  ): Promise<any> {
    const tool = this.tools.get(toolName);
    if (!tool) throw new Error(`Tool not found: ${toolName}`);
    return tool.handler(args, context);
  }

  async executeRequest(
    request: AgentToolRequest,
    context: ToolContext
  ): Promise<any> {
    return this.execute(request.tool_name, request.arguments, context);
  }
}
