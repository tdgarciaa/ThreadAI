// index.ts

//Wrangles i needed to run and generate types of cloudfare workersÇ/durables objects
//Partykits need wrangler toolsate to manage the local code.

import {
  ChannelEventSchema,
  PresenceMessageSchema,
  UserSchema,
} from "@/schemas/realtime";
import { Connection, routePartykitRequest, Server } from "partyserver";
import { z } from "zod";

type ENV = { Chat: DurableObjectNamespace<Chat> };

const ConnectionSateSchema = z
  .object({
    user: UserSchema.nullable().optional(),
  })
  .nullable();
type ConnectionState = z.infer<typeof ConnectionSateSchema>;

type Message = z.infer<typeof PresenceMessageSchema>;

// Define your Server
export class Chat extends Server {
  static options: { hibernate: true };

  onConnect(connection: Connection) {
    console.log("Connected", connection.id, "to server", this.name);

    //Set current presence to the new connected users
    connection.send(JSON.stringify(this.getPresenceMessage()));
  }

  onClose(connection: Connection) {
    console.log(`User disconnected : ${connection.id}`);

    this.updateUsers();
  }

  onError(connection: Connection) {
    console.log(`connection error: ${connection.id}`);
  }
  //Handles incoming request from other clients
  onMessage(connection: Connection, message: string) {
    try {
      const parsed = JSON.parse(message);

      //Validates Schema
      const presence = PresenceMessageSchema.safeParse(parsed);

      if (presence.success) {
        if (presence.data.type === "add-user") {
          //Store user info on the connection state on the server side
          this.setConnectionState(connection, { user: presence.data.payload });
          //Broadcats upadated presence to all clients
          this.updateUsers();

          return;
        }
        if (presence.data.type === "remove-user") {
          this.setConnectionState(connection, null);

          this.updateUsers();
          return;
        }
      }
      const channelEvent = ChannelEventSchema.safeParse(parsed);

      if (channelEvent.success) {
        const payload = JSON.stringify(channelEvent.data);

        this.broadcast(payload, [connection.id]);
        return;
      }
    } catch (error) {
      console.log("Error procesing. brodcast:" + error);
    }
  }

  updateUsers() {
    const presenceMessage = JSON.stringify(this.getPresenceMessage());

    //Use party server built in broadcast
    this.broadcast(presenceMessage);
  }

  getPresenceMessage() {
    return {
      type: "presence",
      payload: { users: this.getUsers() },
    } satisfies Message;
  }

  getUsers() {
    const users = new Map();

    for (const connection of this.getConnections()) {
      const state = this.getConnectionState(connection);

      if (state?.user) {
        users.set(state.user.id, state.user);
      }
    }

    return Array.from(users.values());
  }

  private setConnectionState(connection: Connection, state: ConnectionState) {
    connection.setState(state);
  }

  private getConnectionState(connection: Connection): ConnectionState {
    const result = ConnectionSateSchema.safeParse(connection.state);

    if (result.success) {
      return result.data;
    }
    return null;
  }
}

//This is the mami entrypoint for the cloudfare worker. Workers requierd export default with fetch handler
export default {
  // Set up your fetch handler to use configured Servers
  //Call everytime.
  async fetch(request: Request, env: Env): Promise<Response> {
    return (
      //Party server helper function, inspects request url and routes it to the correct durable object intance
      //handels web socket uphrade to realtime  connections  and return response. If not returns error
      (await routePartykitRequest(request, env)) ||
      new Response("Not Found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
