import {
  Callout,
  DocList,
  DocPageHeader,
  DocSection,
  DocSteps,
  StepCard,
} from "@/app/docs/components/doc-ui";

export default function MostradorDocsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <DocPageHeader
        title="Venta por Mostrador"
        description="Registrá pedidos rápidos para llevar o consumir en el momento, sin necesidad de asignar una mesa."
      />

      <DocSection title="Vista del Mostrador">
        <p className="text-gray-700 mb-4">
          La sección <strong>Mostrador</strong> está pensada para ventas rápidas:
          pedidos para llevar, de barra o cualquier situación donde no se utiliza
          una mesa del salón.
        </p>
        <p className="text-gray-700 mb-2">
          La pantalla está dividida en dos áreas:
        </p>
        <DocList>
          <li>
            <strong>Izquierda:</strong> filtro de categorías y grilla de
            productos disponibles.
          </li>
          <li>
            <strong>Derecha:</strong> panel del pedido en curso con resumen,
            método de pago y botón de confirmación.
          </li>
        </DocList>
      </DocSection>

      <StepCard step={1} title="Filtrar por categoría (opcional)">
        <p className="text-gray-700 mb-3">
          En la parte superior de la grilla encontrarás los botones de
          categorías disponibles.
        </p>
        <DocList>
          <li>
            Hacé click en <strong>&quot;Todos&quot;</strong> para ver todos los
            productos disponibles.
          </li>
          <li>
            Hacé click en el nombre de una categoría para mostrar solo sus
            productos.
          </li>
          <li>
            En pantallas pequeñas, los botones se pueden deslizar
            horizontalmente.
          </li>
        </DocList>
      </StepCard>

      <StepCard step={2} title="Agregar productos al pedido">
        <p className="text-gray-700 mb-3">
          Hacé click sobre el producto que querés agregar en la grilla.
        </p>
        <DocList>
          <li>
            Si el producto <strong>no tiene opciones</strong>, se agrega al
            pedido de inmediato. Si ya está en el pedido, incrementa la cantidad
            en uno.
          </li>
          <li>
            Si el producto <strong>tiene opciones</strong> (indicado con la
            etiqueta &quot;Con opciones&quot;), se abre un diálogo para elegir
            los modificadores antes de agregarlo.
          </li>
          <li>
            Los productos <strong>sin stock</strong> aparecen con menor opacidad
            y no se pueden seleccionar.
          </li>
        </DocList>
        <Callout type="tip">
          Podés agregar el mismo producto varias veces. Si no tiene
          modificadores, cada click suma una unidad directamente al pedido.
        </Callout>
      </StepCard>

      <StepCard step={3} title="Editar items del pedido">
        <p className="text-gray-700 mb-3">
          Desde el panel derecho podés ajustar cada item antes de confirmar:
        </p>
        <DocList>
          <li>
            <strong>Cantidad:</strong> usá los botones <strong>−</strong> y{" "}
            <strong>+</strong> para cambiar la cantidad.
          </li>
          <li>
            <strong>Notas:</strong> hacé click en el ícono de mensaje para
            agregar instrucciones especiales (ej: &quot;sin cebolla&quot;,
            &quot;extra salsa&quot;). Confirmá con Enter o el botón Guardar.
          </li>
          <li>
            <strong>Eliminar:</strong> hacé click en la <strong>X</strong> en la
            esquina superior derecha del item para quitarlo del pedido.
          </li>
        </DocList>
      </StepCard>

      <StepCard step={4} title="Seleccionar método de pago">
        <p className="text-gray-700 mb-3">
          En el panel del pedido, elegí cómo va a pagar el cliente:
        </p>
        <DocList>
          <li>
            <strong>Efectivo</strong>
          </li>
          <li>
            <strong>Tarjeta</strong> (crédito o débito)
          </li>
          <li>
            <strong>Transferencia</strong>
          </li>
          <li>
            <strong>QR</strong>
          </li>
          <li>
            <strong>Link de pago</strong>
          </li>
        </DocList>
        <Callout type="tip">
          El método seleccionado se resalta en oscuro. Por defecto está
          seleccionado Efectivo.
        </Callout>
      </StepCard>

      <StepCard step={5} title="Confirmar el pedido">
        <DocSteps>
          <li>
            Revisá el total que aparece en la parte inferior del panel del
            pedido.
          </li>
          <li>
            Hacé click en <strong>&quot;Confirmar pedido&quot;</strong>.
          </li>
          <li>
            El sistema registra la venta, limpia el pedido y queda listo para
            una nueva transacción.
          </li>
        </DocSteps>
        <Callout type="warning">
          El botón de confirmar está deshabilitado si el pedido está vacío.
          Asegurate de agregar al menos un producto antes de confirmar.
        </Callout>
      </StepCard>

      <DocSection title="Caja / Arqueo">
        <p className="text-gray-700 mb-3">
          Las ventas por mostrador se asocian automáticamente a la caja
          (arqueo) abierta del turno.
        </p>
        <DocList>
          <li>
            Si hay <strong>una sola caja abierta</strong>, se asigna
            automáticamente y se muestra su nombre en el panel.
          </li>
          <li>
            Si hay <strong>varias cajas abiertas</strong>, aparece un selector
            para elegir a cuál se imputa la venta.
          </li>
          <li>
            Si <strong>no hay ninguna caja abierta</strong>, la venta se
            registra igualmente pero sin asignación a un arqueo.
          </li>
        </DocList>
      </DocSection>
    </div>
  );
}
