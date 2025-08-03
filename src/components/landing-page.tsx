
"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LayoutGrid, Move, Plus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "./auth-provider";

export function LandingPage() {
  const { user } = useAuth();
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background border-b">
        <Link className="flex items-center justify-center" href="#">
          <LayoutGrid className="h-6 w-6 text-primary" />
          <span className="sr-only">Kadichii</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href={user ? "/dashboard" : "/login"}
          >
            Ir a la aplicación
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-background">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Organiza tu vida con Kadichii
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Un tablero Kanban sencillo y elegante para visualizar tus
                    tareas y ser más productivo.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href={user ? "/dashboard" : "/signup"}>
                    <Button size="lg">Empezar ahora</Button>
                  </Link>
                </div>
              </div>
              <img
                alt="Hero"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
                data-ai-hint="screenshot of kanban board"
                src="https://placehold.co/600x400.png"
              />
            </div>
          </div>
        </section>
        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-muted"
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-background px-3 py-1 text-sm">
                  Características Clave
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Todo lo que necesitas para ser productivo
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Kadichii está repleto de funciones para ayudarte a gestionar
                  tus proyectos y tareas con facilidad.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Arrastrar y Soltar</CardTitle>
                  <CardDescription>
                    Mueve tareas entre columnas fácilmente con una sencilla
                    interfaz de arrastrar y soltar.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Move className="h-10 w-10 text-primary" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Crea Proyectos</CardTitle>
                  <CardDescription>
                    Organiza tu trabajo en diferentes proyectos para mantener
                    todo en orden.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Plus className="h-10 w-10 text-primary" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Columnas Personalizables</CardTitle>
                  <CardDescription>
                    Crea, renombra y elimina columnas para adaptarlas a tu
                    flujo de trabajo.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LayoutGrid className="h-10 w-10 text-primary" />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          © 2024 Kadichii. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
