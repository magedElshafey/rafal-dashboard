# Products table sizing and scroll ownership

## Evidence and scope

Static review found natural table sizing, unrestricted SKU content and unlimited product-name wrapping. Infinite pagination appends rows to the same table, so new content can change intrinsic column widths. This is a concrete sizing vulnerability, not proof that every movement in the reported recording is reflow. Moving columns out of view during intentional horizontal scrolling is expected.

The dashboard grid already uses minmax(0, 1fr), with min-width: 0 on the application and content. The document owns vertical scrolling; the shared table container owns horizontal scrolling. It has no bounded height or independent vertical viewport. The sidebar navigation has its own vertical scroll region. The topbar is sticky, but Products table headers and columns are not. Infinite scrolling requests data; it does not assign scrollLeft or column widths. Sidebar resizing changes the grid track through a CSS variable, with RTL-aware pointer and keyboard handling.

## Change

Only Products opts into fixed table layout. A minimum width of 85rem is the sum of its column budgets: Product 20, SKU 12, base price 9, discount 7, variants 8, new-arrival 9, status 8, order 7 and actions 5. Product space includes a 3.5rem image, 0.75rem gap and 2.5rem cell padding, leaving 13.25rem for the name. Wider viewports can distribute extra space; narrower viewports retain the existing horizontal scroller. Header and body share the same native table grid.

Names are clamped to two lines; SKU uses one-line ellipsis. Full strings remain in the DOM and existing Radix tooltips expose them on hover or keyboard focus, with Escape dismissal and visible focus. SKU retains LTR isolation. Numeric cells align to logical end and wrap exceptional long values rather than overlapping adjacent cells. No column is removed. Existing mobile cards, shared tables, shell and sidebar are unchanged. No JavaScript measurements, scrollLeft assumptions, sticky columns or overflow masking were added.

Natural sizing with bounded names alone would still allow later numeric values to redistribute columns. Sticky identity columns would not solve sizing and would consume scarce viewport space. Fixed layout is scoped to this known nine-column dataset.

## Browser verification pending

Browser tooling and the Windows fallback both failed to initialize with "trusted Node process exited unexpectedly". No DOM measurements, screenshots, trackpad tests or visual reproduction were possible. Component tests cannot establish real scroll geometry.

Before release, run this matrix against /dashboard/products with enough records for multiple pages:

- English LTR and Arabic RTL; viewport widths 390, 768, 1024, 1280 and 1920px; repeat desktop at 200% zoom.
- At desktop widths, sidebar expanded at 220, 256 and 360px, collapsed at 64px, and dragged continuously between limits. Below desktop, check mobile navigation open/close.
- Include long spaced and unbroken names, long SKUs, missing/loaded/failed images, active/inactive and new-arrival badges, and extreme numeric values. Include long content only on page two.
- Record documentElement.scrollWidth/clientWidth: no unintended document horizontal overflow. Record the table container scrollWidth/clientWidth: horizontal overflow is expected when the table is wider than available space.
- Measure header/cell getBoundingClientRect widths before/after horizontal and vertical scrolling and page append, without changing viewport/sidebar. Widths should remain equal; horizontal movement changes positions, not widths. Sidebar/viewport changes may redistribute extra space.
- Scroll vertically over and outside the table, horizontally by scrollbar/trackpad, and Shift+wheel where supported. Confirm only the table moves horizontally, every column/action is reachable, and no diagonal gesture is mistaken for reflow. Do not assume a positive RTL scrollLeft range.
- Tab to the table and use arrow keys to scroll. Tab to name/SKU, read full tooltip text, dismiss with Escape and continue to actions. Confirm focus is visible even at either scroll edge, tooltip text fits the viewport, and mixed Arabic/Latin content is readable.
- Apply/reset filters and sorting, append another page, retry failed pagination, and open View/Edit/Delete actions without confirming deletion. Confirm loading, empty and error states still fit.

Do not treat build or unit-test success as visual sign-off. Bundle-size warnings are separate from table geometry.
