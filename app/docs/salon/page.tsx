import {
  Callout,
  DocList,
  DocPageHeader,
  DocSection,
  DocSteps,
  StatusTable,
  StepCard,
} from "@/app/docs/components/doc-ui";

const tableStatuses = [
  {
    color: "bg-green-500",
    label: "Disponible",
    description: "Sin órdenes activas, lista para ser asignada",
  },
  {
    color: "bg-red-500",
    label: "Ocupada",
    description: "Tiene una orden activa en curso",
  },
];

export default function SalonDocsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <DocPageHeader
        title="Guía de uso: Salón y Mesas"
        description="Aprendé a gestionar el salón, crear órdenes, agregar productos y cerrar mesas paso a paso."
      />

      <DocSection title="Vista del Salón">
        <p className="text-gray-700 mb-4">
          La sección <strong>Mesas</strong> muestra el plano interactivo del
          salón organizado por sectores. Desde aquí podés ver el estado de cada
          mesa en tiempo real y gestionar las órdenes.
        </p>
        <p className="text-gray-700 mb-4">
          En la parte superior encontrarás los{" "}
          <strong>tabs de sectores</strong> (por ejemplo: Salón principal,
          Terraza, Barra). Hacé click en cada uno para navegar entre ellos.
        </p>
        <h3 className="font-semibold mb-3">Estado de las mesas</h3>
        <StatusTable rows={tableStatuses} />
      </DocSection>

      <StepCard step={1} title="Seleccionar una mesa">
        <p className="text-gray-700 mb-3">
          Hacé click sobre cualquier mesa disponible (verde) en el plano del
          salón.
        </p>
        <DocList>
          <li>
            Se abrirá un <strong>panel lateral</strong> en el lado derecho de la
            pantalla con el detalle de esa mesa.
          </li>
          <li>
            Si la mesa ya tiene una orden activa, verás los items y el total
            actual.
          </li>
          <li>
            Si está disponible, el panel te permitirá crear una nueva orden.
          </li>
        </DocList>
      </StepCard>

      <StepCard step={2} title="Crear una orden">
        <p className="text-gray-700 mb-4">
          Con el panel lateral de la mesa abierto:
        </p>
        <DocSteps>
          <li>
            Ingresá la <strong>cantidad de personas</strong> en el campo{" "}
            <em>&quot;Personas&quot;</em>.
          </li>
          <li>
            Hacé click en el botón <strong>&quot;Nueva Orden&quot;</strong>.
          </li>
          <li>
            La orden queda creada y la mesa pasa al estado{" "}
            <strong>Ocupada</strong> (rojo).
          </li>
        </DocSteps>
        <Callout type="tip">
          Las mesas compartidas pueden tener múltiples órdenes activas al mismo
          tiempo. Usá los tabs en la parte superior del panel para navegar entre
          ellas.
        </Callout>
      </StepCard>

      <StepCard step={3} title="Agregar productos a la orden">
        <DocSteps>
          <li>
            En el panel lateral, hacé click en{" "}
            <strong>&quot;Agregar productos&quot;</strong>.
          </li>
          <li>
            Se abre el <strong>selector de productos</strong> con búsqueda y
            filtro por categoría.
          </li>
          <li>
            Navegá entre las categorías o usá el buscador para encontrar el
            producto.
          </li>
          <li>Hacé click en el producto para agregarlo a la orden.</li>
          <li>
            Si el producto tiene <strong>modificadores</strong> (extras,
            variantes, opciones de cocción, etc.), se abrirá automáticamente un
            diálogo para seleccionarlos. Elegí las opciones deseadas y confirmá.
          </li>
          <li>El item aparecerá en la lista de la orden con su precio.</li>
        </DocSteps>
        <Callout type="tip">
          Podés agregar el mismo producto varias veces. Cada click agrega una
          unidad adicional.
        </Callout>
      </StepCard>

      <StepCard step={4} title="Enviar items a cocina">
        <p className="text-gray-700 mb-4">
          Los productos recién agregados aparecen primero como{" "}
          <strong>items pendientes</strong> — son visibles en el sistema pero
          todavía no fueron enviados a cocina.
        </p>
        <DocSteps>
          <li>
            Revisá los items en la lista para confirmar que todo esté correcto.
          </li>
          <li>
            Hacé click en <strong>&quot;Confirmar&quot;</strong> o{" "}
            <strong>&quot;Enviar a cocina&quot;</strong> para comprometer los
            items.
          </li>
          <li>
            Los items pasan al estado <strong>confirmado</strong> y, si hay
            impresoras configuradas, se imprime el ticket de cocina
            automáticamente.
          </li>
        </DocSteps>
        <Callout type="warning">
          Los items pendientes que no fueron confirmados{" "}
          <strong>no llegan a cocina</strong>. Siempre confirmá antes de
          alejarte de la mesa.
        </Callout>
      </StepCard>

      <StepCard step={5} title="Cerrar la mesa">
        <p className="text-gray-700 mb-4">Cuando el cliente pide la cuenta:</p>
        <DocSteps>
          <li>
            En el panel lateral de la mesa, hacé click en{" "}
            <strong>&quot;Cerrar Mesa&quot;</strong>.
          </li>
          <li>
            Se abre el <strong>diálogo de cierre</strong> con el resumen
            detallado de la orden: items, cantidades y total.
          </li>
          <li>
            Seleccioná el <strong>método de pago</strong>: Efectivo, Tarjeta de
            crédito, Tarjeta de débito, Mercado Pago, u otros métodos
            disponibles.
          </li>
          <li>
            (Opcional) Aplicá un <strong>descuento</strong> ingresando un
            porcentaje o un monto fijo.
          </li>
          <li>
            Confirmá el pago haciendo click en{" "}
            <strong>&quot;Confirmar&quot;</strong>.
          </li>
          <li>
            La mesa vuelve automáticamente al estado{" "}
            <strong>Disponible</strong> (verde) y queda lista para la próxima
            ocupación.
          </li>
        </DocSteps>
        <Callout type="tip">
          Si el cliente paga con diferentes métodos (pago mixto), podés dividir
          el monto entre varios métodos de pago desde el mismo diálogo.
        </Callout>
      </StepCard>
    </div>
  );
}
