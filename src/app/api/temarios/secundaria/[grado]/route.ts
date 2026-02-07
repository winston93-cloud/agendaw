import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const FILENAMES: Record<string, string> = {
  '1': 'TEMARIO ADMISIÓN 1°.pdf',
  '2': 'TEMARIO ADMISIÓN 2°.pdf',
  '3': 'TEMARIO ADMISIÓN 3°.pdf',
  ingles: 'TEMARIO INGLES SECUNDARIA.pdf',
}

function getSecundariaDir(): string | null {
  const possible = [
    path.join(process.cwd(), 'Secundaria'),
    path.join(process.cwd(), 'public', 'Secundaria'),
  ]
  for (const dir of possible) {
    try {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) return dir
    } catch {
      continue
    }
  }
  return null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ grado: string }> }
) {
  const { grado } = await params
  const filename = FILENAMES[grado]
  if (!filename) {
    return NextResponse.json({ error: 'Grado no válido. Use 1, 2, 3 o ingles.' }, { status: 400 })
  }

  const dir = getSecundariaDir()
  if (!dir) {
    return NextResponse.json({ error: 'Temarios no disponibles' }, { status: 404 })
  }

  const filePath = path.join(dir, filename)
  try {
    const content = fs.readFileSync(filePath)
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename.replace(/"/g, '%22')}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
  }
}
