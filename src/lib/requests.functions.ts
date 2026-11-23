import { createServerFn } from "@tanstack/react-start";
import { earlyLeadSchema, completedLeadSchema } from "./leads";

export const saveContact = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => earlyLeadSchema.parse(input))
  .handler(async ({ data }) => {
    const { captureEarlyLead } = await import("./leads.server");
    return captureEarlyLead(data);
  });

export const saveRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => completedLeadSchema.parse(input))
  .handler(async ({ data }) => {
    const { completeLead } = await import("./leads.server");
    return completeLead(data);
  });