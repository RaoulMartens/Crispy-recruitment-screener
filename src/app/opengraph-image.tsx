import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt =
  "Denk mee over werk vinden en medewerkers werven — afstudeeronderzoek van Crispy";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const [coverData, logoData, poppinsRegular, poppinsSemibold] =
  await Promise.all([
    readFile(join(process.cwd(), "public/social-cover.jpg"), "base64"),
    readFile(join(process.cwd(), "public/crispy-logo.png"), "base64"),
    readFile(
      join(
        process.cwd(),
        "node_modules/@fontsource/poppins/files/poppins-latin-400-normal.woff",
      ),
    ),
    readFile(
      join(
        process.cwd(),
        "node_modules/@fontsource/poppins/files/poppins-latin-600-normal.woff",
      ),
    ),
  ]);

const coverSrc = `data:image/jpeg;base64,${coverData}`;
const logoSrc = `data:image/png;base64,${logoData}`;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: "#fcfcfa",
          color: "#111225",
          padding: "56px",
          fontFamily: "Poppins",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -70,
            right: 238,
            display: "flex",
            width: 190,
            height: 190,
            borderRadius: 999,
            background: "#ffb52a",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -72,
            left: 528,
            display: "flex",
            width: 210,
            height: 150,
            borderRadius: 999,
            background: "#3db8b2",
          }}
        />

        <div
          style={{
            display: "flex",
            width: 640,
            flexDirection: "column",
            justifyContent: "space-between",
            paddingRight: 42,
          }}
        >
          {/* ImageResponse renders embedded assets directly through Satori. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt=""
            width={126}
            height={41}
            style={{ objectFit: "contain" }}
          />

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                maxWidth: 620,
                fontSize: 58,
                fontWeight: 600,
                lineHeight: 1.08,
                letterSpacing: "-2.2px",
              }}
            >
              Denk mee over werk vinden en medewerkers werven
            </div>
            <div
              style={{
                display: "flex",
                maxWidth: 570,
                marginTop: 24,
                color: "#5f6270",
                fontSize: 24,
                lineHeight: 1.42,
              }}
            >
              Jouw ervaring helpt bij een kort afstudeeronderzoek van Crispy.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              border: "2px solid #d7d8df",
              borderRadius: 999,
              background: "#ffffff",
              padding: "10px 20px",
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            Invullen duurt ongeveer 1–2 minuten
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            overflow: "hidden",
            border: "2px solid #ffffff",
            borderRadius: 26,
            background: "#e4f4f2",
            boxShadow: "0 18px 45px rgba(17, 18, 37, 0.18)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverSrc}
            alt=""
            width={448}
            height={518}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Poppins",
          data: poppinsRegular,
          style: "normal",
          weight: 400,
        },
        {
          name: "Poppins",
          data: poppinsSemibold,
          style: "normal",
          weight: 600,
        },
      ],
    },
  );
}
