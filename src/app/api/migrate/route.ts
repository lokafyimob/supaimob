import { NextRequest, NextResponse } from "next/server"

export async function POST(_request: NextRequest) {
  return NextResponse.json({
    error: "Database schema out of sync", 
    missing_columns: ["properties.images", "contracts.condominiumDeductible"],
    solution: "Need to run: npx prisma db push --force-reset"
  })
}
