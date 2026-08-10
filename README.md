# App de Cotizaciones — SOLUINGENIUS

Aplicación web de una sola página (HTML/CSS/JS, sin dependencias) para generar cotizaciones con modalidad **IVA** o **AIU**.

## Funcionalidades

- Consecutivo automático de cotización (año-número), se confirma solo al guardar.
- Datos de la empresa y logo editables (persisten en el navegador).
- Directorio de clientes: crear, buscar, editar y eliminar, con selección rápida para la cotización.
- Modalidad **Con IVA** o **Con AIU** (IVA calculado sobre la utilidad).
- Tabla de ítems con unidades de medida predefinidas y cálculo automático de totales.
- Condiciones de pago (forma y plazo), observaciones y cierre con firma del gerente.
- Impresión / exportación a PDF desde el navegador.
- Historial de cotizaciones guardadas localmente.

## Uso

Es un sitio 100% estático: basta con abrir `index.html` en el navegador, o desplegarlo en cualquier hosting estático (Vercel, Netlify, GitHub Pages, etc.). No requiere build ni backend; los datos se guardan en el `localStorage` del navegador.

## Despliegue en Vercel

1. Importar este repositorio en Vercel.
2. Framework preset: **Other** (sitio estático).
3. Sin comando de build ni carpeta de salida especiales — Vercel sirve `index.html` directamente.
