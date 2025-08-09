
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-8">
        <Button asChild variant="outline" size="sm">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Link>
        </Button>
      </header>
      <article className="prose prose-stone dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold mb-4">Política de Privacidad de Kadichii</h1>
        <p className="text-muted-foreground">Última actualización: 24 de Mayo de 2024</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-2">1. Introducción</h2>
        <p>
          Bienvenido a Kadichii. Nos comprometemos a proteger tu privacidad. Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y salvaguardamos tu información cuando visitas nuestra aplicación web.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-2">2. Información que Recopilamos</h2>
        <p>
          Podemos recopilar información sobre ti de varias maneras. La información que podemos recopilar incluye:
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Datos Personales:</strong> Información de identificación personal, como tu nombre, dirección de correo electrónico, que nos proporcionas voluntariamente cuando te registras en la Aplicación.
          </li>
          <li>
            <strong>Datos de Uso:</strong> Información que nuestros servidores recopilan automáticamente cuando accedes a la Aplicación, como tu dirección IP, tipo de navegador, sistema operativo, etc.
          </li>
          <li>
            <strong>Datos de la Aplicación:</strong> Recopilamos los datos que tú generas, como proyectos, tareas, columnas, comentarios y dibujos en la pizarra, para proporcionar el servicio.
          </li>
          <li>
            <strong>Cookies:</strong> Utilizamos cookies para ayudar a personalizar y mejorar tu experiencia. Puedes encontrar más información en nuestro banner de cookies.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-2">3. Cómo Usamos tu Información</h2>
        <p>
          Tener información precisa sobre ti nos permite proporcionarte una experiencia fluida, eficiente y personalizada. Específicamente, podemos usar la información recopilada sobre ti para:
        </p>
         <ul className="list-disc list-inside space-y-2">
          <li>Crear y gestionar tu cuenta.</li>
          <li>Proporcionar la funcionalidad principal de la aplicación (gestión de proyectos, tareas, etc.).</li>
          <li>Permitir la colaboración entre usuarios.</li>
          <li>Mejorar la eficiencia y el funcionamiento de la Aplicación.</li>
          <li>Responder a solicitudes de servicio al cliente.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-2">4. Divulgación de tu Información</h2>
        <p>
          No compartiremos tu información con terceros excepto en las siguientes situaciones:
        </p>
         <ul className="list-disc list-inside space-y-2">
            <li><strong>Por Ley o para Proteger Derechos:</strong> Si la divulgación es necesaria para responder a un proceso legal, investigar posibles violaciones de nuestras políticas, o proteger los derechos, la propiedad y la seguridad de otros.</li>
            <li><strong>Proveedores de Servicios:</strong> Utilizamos Firebase de Google como nuestro proveedor de backend. Su uso de la información se rige por su propia política de privacidad.</li>
         </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-2">5. Tus Derechos de Protección de Datos (GDPR)</h2>
        <p>
          Si eres residente del Espacio Económico Europeo (EEE), tienes ciertos derechos de protección de datos. Nuestro objetivo es tomar medidas razonables para permitirte corregir, modificar, eliminar o limitar el uso de tus Datos Personales.
        </p>
         <ul className="list-disc list-inside space-y-2">
            <li><strong>El derecho de acceso, actualización o eliminación de la información que tenemos sobre ti.</strong> Puedes gestionar tu cuenta y eliminarla desde el panel de Configuración.</li>
            <li><strong>El derecho a la portabilidad de los datos.</strong> Puedes solicitar una copia de tus datos desde el panel de Configuración.</li>
            <li><strong>El derecho a retirar el consentimiento.</strong></li>
         </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-2">6. Contacto</h2>
        <p>
          Si tienes preguntas o comentarios sobre esta Política de Privacidad, por favor contáctanos en: contacto@kadichii.com
        </p>
      </article>
    </div>
  );
}
