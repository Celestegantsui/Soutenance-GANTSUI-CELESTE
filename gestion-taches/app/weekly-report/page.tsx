"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axiosConfig";
import jsPDF from "jspdf";

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  createdBy: string | number;
  technician_name?: string;
  start_date?: string;
  end_date?: string;
}

export default function WeeklyReportPage() {
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);

  useEffect(() => {
    // Charger les tâches depuis l'API
    axios
      .get("/api/tasks")
      .then((res) => {
        const tasks = Array.isArray(res.data?.tasks) ? res.data.tasks : [];
        const completed = tasks.filter(
          (t: any) => String(t.status).toLowerCase() === "terminé" || String(t.status).toLowerCase() === "termine"
        );
        const pending = tasks.filter(
          (t: any) => String(t.status).toLowerCase() !== "terminé" && String(t.status).toLowerCase() !== "termine"
        );
        setCompletedTasks(completed);
        setPendingTasks(pending);
      })
      .catch((err) => console.error("Erreur chargement tâches:", err));

    // Charger les techniciens
    axios
      .get("/api/technicians")
      .then((res) => setTechnicians(res.data || []))
      .catch((err) => console.error("Erreur chargement techniciens:", err));
  }, []);

  const getTechnicianName = (createdBy: string | number) => {
    const tech = technicians.find((t) => String(t.id) === String(createdBy));
    return tech?.name || createdBy;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("fr-FR");
  };

  const formatExportDate = () => {
    return new Date().toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const loadLogoAsDataUrl = async () => {
    return new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Impossible de charger le logo."));
          return;
        }

        // Supprime tout contour carré : on garde uniquement le logo dans un masque circulaire.
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
        ctx.restore();

        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Logo introuvable."));
      img.src = "/logo.PNG";
    });
  };

  const drawRoundedRect = (
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    radius = 2,
    style: "S" | "F" | "DF" = "S"
  ) => {
    doc.roundedRect(x, y, width, height, radius, radius, style);
  };

  const exportToPDF = async () => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    let yPosition = margin;

    const headerColor: [number, number, number] = [27, 85, 102];
    const greenColor: [number, number, number] = [46, 125, 50];
    const orangeColor: [number, number, number] = [239, 108, 0];
    const lightGray: [number, number, number] = [245, 245, 245];
    const lineGray: [number, number, number] = [210, 210, 210];

    const safeText = (value: unknown) => (value == null ? "-" : String(value));
    const getService = (task: any) =>
      safeText(task?.department || task?.service || task?.team || "Maintenance");

    const rowsCompleted = completedTasks.map((task, index) => ({
      num: String(index + 1),
      title: safeText(task.title),
      service: getService(task),
      technician: safeText(getTechnicianName(task.createdBy)),
      dueDate: formatDate(task.end_date || task.start_date),
      status: "terminé",
    }));

    const rowsPending = pendingTasks.map((task, index) => ({
      num: String(index + 1),
      title: safeText(task.title),
      service: getService(task),
      technician: safeText(getTechnicianName(task.createdBy)),
      dueDate: formatDate(task.end_date || task.start_date),
      status: "en cours",
    }));

    doc.setFillColor(...headerColor);
    drawRoundedRect(doc, margin, yPosition, pageWidth - margin * 2, 34, 0, "F");

    try {
      const logoData = await loadLogoAsDataUrl();
      doc.addImage(logoData, "PNG", margin + 4, yPosition + 4, 22, 22);
    } catch {
      // Le PDF reste valide même sans logo.
    }

    doc.setTextColor(173, 205, 84);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Rapport Hebdomadaire - Tâches", pageWidth / 2, yPosition + 12, { align: "center" });

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`Exporté le : ${formatExportDate()}`, pageWidth / 2, yPosition + 20, { align: "center" });

    yPosition += 42;

    const cardWidth = (pageWidth - margin * 2 - 10) / 2;
    const cardHeight = 27;

    const drawStatCard = (
      x: number,
      title: string,
      value: number,
      color: [number, number, number],
      iconText: string
    ) => {
      doc.setFillColor(...color);
      drawRoundedRect(doc, x, yPosition, cardWidth, cardHeight, 2, "F");
      doc.setFillColor(245, 245, 245);
      doc.circle(x + 10, yPosition + 13.5, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...color);
      doc.text(iconText, x + 10, yPosition + 14.8, { align: "center" });

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`${title}: ${value}`, x + 18, yPosition + 15);
    };

    drawStatCard(margin + 5, "Tâches terminées", completedTasks.length, greenColor, "YES");
    drawStatCard(margin + 5 + cardWidth + 10, "Tâches en cours", pendingTasks.length, orangeColor, "NO");

    yPosition += cardHeight + 10;

    const drawSectionTitle = (title: string, color: [number, number, number]) => {
      doc.setFillColor(...color);
      doc.rect(margin + 1, yPosition - 4.5, 1.6, 8, "F");
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(title, margin + 6, yPosition);
      yPosition += 6;
    };

    const colWidths = [8, 66, 40, 24, 22];
    const colStarts = colWidths.reduce<number[]>((acc, width, idx) => {
      if (idx === 0) return [margin + 2];
      return [...acc, acc[idx - 1] + colWidths[idx - 1]];
    }, []);
    const tableWidth = colWidths.reduce((sum, w) => sum + w, 0);
    const rowHeight = 9;
    const tableBottomMargin = 20;

    const drawTableHeader = (topY: number) => {
      doc.setFillColor(...lightGray);
      doc.setDrawColor(...lineGray);
      drawRoundedRect(doc, margin + 2, topY, tableWidth, rowHeight, 1, "DF");
      const headers = ["#", "Titre", "Technicien", "Date fin", "Statut"];
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      headers.forEach((header, i) => {
        doc.text(header, colStarts[i] + colWidths[i] / 2, topY + 5.7, { align: "center" });
      });
    };

    const drawStatusPill = (x: number, y: number, status: string) => {
      const isDone = status.toLowerCase().includes("termin");
      const color: [number, number, number] = isDone ? [56, 142, 60] : [245, 124, 0];
      const pillWidth = 16;
      const pillHeight = 5.4;
      const pillX = x + (colWidths[4] - pillWidth) / 2;
      const pillY = y + 1.8;
      doc.setFillColor(...color);
      drawRoundedRect(doc, pillX, pillY, pillWidth, pillHeight, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(status, pillX + pillWidth / 2, pillY + 3.8, { align: "center" });
    };

    const drawTableRows = (rows: Array<{ num: string; title: string; service: string; technician: string; dueDate: string; status: string }>) => {
      drawTableHeader(yPosition);
      yPosition += rowHeight;

      if (rows.length === 0) {
        doc.setDrawColor(...lineGray);
        doc.rect(margin + 2, yPosition, tableWidth, rowHeight, "S");
        doc.setTextColor(90, 90, 90);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.text("Aucune donnée pour cette section.", margin + 6, yPosition + 5.7);
        yPosition += rowHeight + 6;
        return;
      }

      rows.forEach((row) => {
        if (yPosition > pageHeight - tableBottomMargin) {
          doc.addPage();
          yPosition = margin + 8;
          drawTableHeader(yPosition);
          yPosition += rowHeight;
        }

        doc.setDrawColor(...lineGray);
        doc.rect(margin + 2, yPosition, tableWidth, rowHeight, "S");
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(8);

        const values = [row.num, row.title, row.technician, row.dueDate];
        values.forEach((value, index) => {
          const maxWidth = colWidths[index] - 2;
          const text = doc.splitTextToSize(value, maxWidth)[0] || "-";
          doc.text(text, colStarts[index] + colWidths[index] / 2, yPosition + 5.7, { align: "center" });
        });

        drawStatusPill(colStarts[4], yPosition, row.status);
        yPosition += rowHeight;
      });

      yPosition += 8;
    };

    drawSectionTitle("Tâches terminées", greenColor);
    drawTableRows(rowsCompleted);

    drawSectionTitle("Tâches en cours", orangeColor);
    drawTableRows(rowsPending);

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i += 1) {
      doc.setPage(i);
      doc.setDrawColor(27, 85, 102);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      doc.setTextColor(27, 85, 102);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("ARPCE", margin + 2, pageHeight - 4.5);
      doc.setFont("helvetica", "normal");
      doc.text(new Date().toLocaleDateString("fr-FR"), pageWidth / 2, pageHeight - 4.5, { align: "center" });
      doc.text(`${i} / ${totalPages}`, pageWidth - margin - 2, pageHeight - 4.5, { align: "right" });
    }

    const filename = `rapport-taches-${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">Réunion du vendredi</h1>

      {/* Tâches terminées */}
      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-green-600">
          ✔ Tâches terminées cette semaine
        </h2>

        {completedTasks.length === 0 ? (
          <p className="text-gray-500 italic">Aucune tâche terminée cette semaine.</p>
        ) : (
          completedTasks.map((t) => (
            <div
              key={t.id}
              className="p-4 border rounded mb-3 bg-green-50 hover:bg-green-100"
            >
              <p className="font-semibold">{t.title}</p>
              <p className="text-sm text-gray-600">
                Terminé par : {getTechnicianName(t.createdBy)}
                {t.end_date && ` — ${new Date(t.end_date).toLocaleDateString("fr-FR")}`}
              </p>
              {t.description && <p className="text-sm text-gray-700 mt-2">{t.description}</p>}
            </div>
          ))
        )}
      </div>

      {/* Tâches en attente */}
      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-orange-600">
          ⚠ Tâches non terminées
        </h2>

        {pendingTasks.length === 0 ? (
          <p className="text-gray-500 italic">Aucune tâche en attente.</p>
        ) : (
          pendingTasks.map((t) => (
            <div
              key={t.id}
              className="p-4 border rounded mb-3 bg-orange-50 hover:bg-orange-100"
            >
              <p className="font-semibold">{t.title}</p>
              <p className="text-sm text-gray-600">
                Assigné à : {getTechnicianName(t.createdBy)}
                {t.start_date && ` — ${new Date(t.start_date).toLocaleDateString("fr-FR")}`}
              </p>
              {t.description && <p className="text-sm text-gray-700 mt-2">{t.description}</p>}
            </div>
          ))
        )}
      </div>

      {/* Bouton Action */}
      <button
        onClick={() => {
          void exportToPDF();
        }}
        className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700"
      >
        Exporter le rapport de la semaine (PDF)
      </button>
    </div>
  );
}
