import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/barber/AdminShell";
export const Route = createFileRoute("/painel")({ component: AdminShell });
