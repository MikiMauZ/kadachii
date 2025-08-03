
"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Columns, Users } from "lucide-react";
import Link from "next/link";
import { useAuth } from "./auth-provider";
import Image from "next/image";

export function LandingPage() {
  const { user } = useAuth();
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background border-b">
        <Link href="#" className="flex items-center justify-center gap-2">
           <Image src="/logo.png" alt="Kadichii logo" width={24} height={24} className="h-6 w-6" />
          <span className="font-bold text-lg">Kadichii</span>
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
                <div className="space-y-4">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Visualiza tu flujo de trabajo, impulsa tu productividad.
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Kadichii es la herramienta visual que te ayuda a gestionar tareas, colaborar en equipo y alcanzar tus objetivos. Simple, flexible y poderoso.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href={user ? "/dashboard" : "/signup"}>
                    <Button size="lg">Empezar ahora - Es gratis</Button>
                  </Link>
                </div>
              </div>
              <Image
                alt="Tablero Kanban de Kadichii"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
                data-ai-hint="screenshot kanban board"
                src="/portada1a.png"
                width={600}
                height={400}
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
                  Una plataforma, infinitas posibilidades
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Desde la planificación de un proyecto personal hasta la coordinación de un equipo, Kadichii te ofrece las herramientas para adaptarte a cualquier desafío.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 sm:grid-cols-1 md:grid-cols-3">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Columns className="h-6 w-6 text-primary" />
                    Tableros Flexibles
                  </CardTitle>
                  <CardDescription>
                    Adapta el tablero a tu manera. Crea, renombra y elimina columnas para que coincidan perfectamente con tu flujo de trabajo.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-6 w-6 text-primary" />
                    Gestión de Tareas
                  </CardTitle>
                  <CardDescription>
                    Añade checklists a tus tareas para desglosar el trabajo, establece fechas de vencimiento para no perder el ritmo y asigna responsables.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" />
                    Colaboración en Equipo
                  </CardTitle>
                  <CardDescription>
                    Invita a miembros a tus proyectos para que todos estén en la misma página. La colaboración nunca ha sido tan sencilla.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

         <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Empieza a organizar tu trabajo en 3 simples pasos.
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Pasa del caos al control en cuestión de minutos.
              </p>
            </div>
            <div className="relative grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
                 <Image
                    alt="Creación de Proyectos"
                    className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center"
                    data-ai-hint="organización planificación"
                    src="/portada2.png"
                    width={600}
                    height={400}
                />
                 <ol className="flex flex-col justify-center gap-6 text-left">
                    <li className="flex gap-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</span>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold">Crea tu Primer Proyecto</h3>
                            <p className="text-muted-foreground">Define un objetivo claro. Dale un nombre y una descripción a tu proyecto para empezar.</p>
                        </div>
                    </li>
                    <li className="flex gap-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">2</span>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold">Añade tus Tareas</h3>
                            <p className="text-muted-foreground">Vuelca todas tus ideas y pendientes en la columna "Por Hacer". No te preocupes por el orden todavía.</p>
                        </div>
                    </li>
                     <li className="flex gap-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">3</span>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold">Arrastra y Organiza</h3>
                            <p className="text-muted-foreground">Mueve tus tareas a través de las columnas a medida que avanzas. ¡Disfruta de la satisfacción de llegar a "Hecho"!</p>
                        </div>
                    </li>
                </ol>
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
