import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, signJWT } from "@/lib/auth";
import {
  verifyOfficerCredentials,
  verifyExporterCredentials,
  REGISTERED_GOVERNMENT_OFFICERS,
  REGISTERED_EXPORTERS,
} from "@/lib/official-credentials";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const portalType = body?.portalType; // "government" | "exporter"
  const identifier = body?.identifier?.trim();
  const password = body?.password?.trim();

  if (!identifier || !password) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISSING_CREDENTIALS",
          message:
            portalType === "exporter"
              ? "Both APEDA/DGFT IEC registration code and trade password are required."
              : "Both Government Officer Employee ID and security password are required.",
        },
      },
      { status: 400 }
    );
  }

  if (portalType === "government") {
    const officer = verifyOfficerCredentials(identifier, password);
    if (!officer) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_GOVT_CREDENTIALS",
            message:
              "Authentication Failed: Invalid Government Officer ID or Security Password. Unauthorized access to FCI Mandi terminals is strictly restricted.",
          },
        },
        { status: 401 }
      );
    }

    // Generate authenticated official session token
    const token = await signJWT({
      sub: `usr_gov_${officer.id}`,
      phone: officer.phone,
      name: officer.name,
      role: "government_buyer",
    });

    const response = NextResponse.json({
      success: true,
      portalType: "government",
      user: {
        id: officer.id,
        name: officer.name,
        department: officer.department,
        designation: officer.designation,
        badge: officer.badge,
        stationId: officer.stationId,
        stationName: officer.stationName,
        jurisdiction: officer.jurisdiction,
        role: officer.role,
      },
    });

    // Set HTTP session cookie (secure: false enables seamless LAN and demo access)
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 86400 * 7, // 7 days
    });

    return response;
  } else if (portalType === "exporter") {
    const exporter = verifyExporterCredentials(identifier, password);
    if (!exporter) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_EXPORTER_CREDENTIALS",
            message:
              "Authentication Failed: Invalid DGFT IEC Registration Code or Exporter Trade Password. Access restricted to APEDA-licensed trading desks.",
          },
        },
        { status: 401 }
      );
    }

    const token = await signJWT({
      sub: `usr_exp_${exporter.id}`,
      phone: exporter.phone,
      name: exporter.name,
      role: "exporter",
    });

    const response = NextResponse.json({
      success: true,
      portalType: "exporter",
      user: {
        id: exporter.id,
        name: exporter.name,
        organization: exporter.organization,
        designation: exporter.designation,
        badge: exporter.badge,
        tradeDesk: exporter.tradeDesk,
        port: exporter.port,
        role: exporter.role,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 86400 * 7,
    });

    return response;
  }

  return NextResponse.json(
    { success: false, error: { code: "INVALID_PORTAL_TYPE", message: "portalType must be 'government' or 'exporter'." } },
    { status: 400 }
  );
}

/**
 * GET handler to expose official public directory metadata (excluding passwords) for validation / testing reference
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "government") {
    const publicOfficers = REGISTERED_GOVERNMENT_OFFICERS.map(({ password, ...rest }) => rest);
    return NextResponse.json({ success: true, officers: publicOfficers });
  } else if (type === "exporter") {
    const publicExporters = REGISTERED_EXPORTERS.map(({ password, ...rest }) => rest);
    return NextResponse.json({ success: true, exporters: publicExporters });
  }

  return NextResponse.json({
    success: true,
    governmentOfficers: REGISTERED_GOVERNMENT_OFFICERS.map(({ password, ...rest }) => rest),
    exporters: REGISTERED_EXPORTERS.map(({ password, ...rest }) => rest),
  });
}
