import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const rawFilename = formData.get("filename") || "setor_principal.glb";

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo .glb recebido para salvar." },
        { status: 400 }
      );
    }

    // Sanitize filename and enforce .glb extension
    let filename = String(rawFilename).trim();
    if (!filename || filename === "File name") {
      filename = "setor_principal.glb";
    }
    // Remove invalid filename characters
    filename = filename.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
    if (!filename.toLowerCase().endsWith(".glb")) {
      filename += ".glb";
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure destination directory exists: <cwd>/public/models
    const targetDir = path.join(process.cwd(), "public", "models");
    await fs.mkdir(targetDir, { recursive: true });

    const targetFilePath = path.join(targetDir, filename);

    // Overwrite existing file or create new
    await fs.writeFile(targetFilePath, buffer);

    console.log(`[API /save-model] Arquivo salvo: ${targetFilePath} (${buffer.length} bytes)`);

    return NextResponse.json({
      success: true,
      message: `Arquivo salvo com sucesso em /public/models/${filename}`,
      filename,
      sizeBytes: buffer.length,
      relativePath: `/models/${filename}`,
    });
  } catch (err) {
    console.error("[API /save-model] Erro ao salvar arquivo:", err);
    return NextResponse.json(
      { error: err.message || "Erro interno ao salvar arquivo GLB." },
      { status: 500 }
    );
  }
}
