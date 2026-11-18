import { NextRequest, NextResponse } from "next/server";

// Simuler une base de données avec des données en mémoire
// En production, ce serait une vraie base de données
let historicalData: any[] = [];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: historicalData,
      message: "Archives récupérées du backend",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const archive = await request.json();

    // Vérifier si l'archive existe déjà
    const existingIndex = historicalData.findIndex((a) => a.month === archive.month);

    if (existingIndex >= 0) {
      historicalData[existingIndex] = archive;
    } else {
      historicalData.push(archive);
    }

    return NextResponse.json({
      success: true,
      message: "Archive sauvegardée avec succès",
      data: archive,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erreur lors de la sauvegarde" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { month } = await request.json();

    historicalData = historicalData.filter((a) => a.month !== month);

    return NextResponse.json({
      success: true,
      message: "Archive supprimée avec succès",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
