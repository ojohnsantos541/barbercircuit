import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/barber/AdminShell";
export const Route = createFileRoute("/_authenticated/painel")({ component: AdminShell });
