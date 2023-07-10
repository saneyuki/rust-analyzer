import type { RecursiveMemoryLayout } from "../lsp_ext";
import { type Nullable, expectNotNull } from "../nullable";
import { unwrapUndefinable } from "../undefinable";

export function showMemoryLayout(data: Nullable<RecursiveMemoryLayout>): void {
    if (!(data && data.nodes.length)) {
        document.body.innerText = "Not Available";
        return;
    }

    data.nodes.map((n) => {
        n.typename = n.typename
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', " & quot; ")
            .replaceAll("'", "&#039;");
        return n;
    });

    let height = window.innerHeight - 64;

    window.addEventListener("resize", (_e) => {
        const newHeight = window.innerHeight - 64;
        height = newHeight;
        container.classList.remove("trans");
        table.classList.remove("trans");
        locate();
        setTimeout(() => {
            // give delay to redraw, annoying but needed
            container.classList.add("trans");
            table.classList.add("trans");
        }, 0);
    });

    const container = document.createElement("div");
    container.classList.add("container");
    container.classList.add("trans");
    document.body.appendChild(container);

    const tooltip = expectNotNull(
        document.getElementById("tooltip"),
        "#toolip must be there on calling this"
    );

    let y = 0;
    let zoom = 1.0;

    const table = document.createElement("table");
    table.classList.add("trans");
    container.appendChild(table);

    const rows: Array<{
        el: HTMLTableRowElement;
        offset: 0;
    }> = [];

    const nodeSetup = function nodeT(idx: number, depth: number, offset: number): void {
        if (!rows[depth]) {
            rows[depth] = { el: document.createElement("tr"), offset: 0 };
        }

        const row = unwrapUndefinable(rows[depth]);

        if (row.offset < offset) {
            const pad = document.createElement("td");
            pad.colSpan = offset - row.offset;
            row.el.appendChild(pad);
            row.offset += offset - row.offset;
        }

        const td = document.createElement("td");
        const node = unwrapUndefinable(data.nodes[idx]);

        td.innerHTML = "<p><span>" + node.itemName + ":</span> <b>" + node.typename + "</b></p>";

        td.colSpan = node.size;

        td.addEventListener("mouseover", (_e) => {
            const node = unwrapUndefinable(data.nodes[idx]);
            tooltip.innerHTML =
                node.itemName +
                ": <b>" +
                node.typename +
                "</b><br/>" +
                "<ul>" +
                "<li>size = " +
                node.size +
                "</li>" +
                "<li>align = " +
                node.alignment +
                "</li>" +
                "<li>field offset = " +
                node.offset +
                "</li>" +
                "</ul>" +
                "<i>double click to focus</i>";

            tooltip.style.display = "block";
        });
        td.addEventListener("mouseleave", (_) => (tooltip.style.display = "none"));

        const totalOffset = row.offset;
        td.addEventListener("dblclick", (_e) => {
            const node0 = unwrapUndefinable(data.nodes[0]);
            zoom = node0.size / node.size;
            y = (-totalOffset / node0.size) * zoom;
            locate();
        });

        row.el.appendChild(td);
        row.offset += node.size;

        if (node.childrenStart !== -1) {
            for (let i = 0; i < node.childrenLen; i++) {
                const childNode = unwrapUndefinable(data.nodes[node.childrenStart + i]);
                if (childNode.size) {
                    nodeT(node.childrenStart + i, depth + 1, offset + childNode.offset);
                }
            }
        }
    };

    nodeSetup(0, 0, 0);

    for (const row of rows) table.appendChild(row.el);

    const grid = document.createElement("div");
    grid.classList.add("grid");
    container.appendChild(grid);

    const node = unwrapUndefinable(data.nodes[0]);
    for (let i = 0; i < node.size / 8 + 1; i++) {
        const el = document.createElement("div");
        el.classList.add("grid-line");
        el.style.top = (i / (node.size / 8)) * 100 + "%";
        el.innerText = String(i * 8);
        grid.appendChild(el);
    }

    window.addEventListener("mousemove", (e) => {
        tooltip.style.top = e.clientY + 10 + "px";
        tooltip.style.left = e.clientX + 10 + "px";
    });

    function locate() {
        container.style.top = height * y + "px";
        container.style.height = height * zoom + "px";

        table.style.width = container.style.height;
    }

    locate();
}
