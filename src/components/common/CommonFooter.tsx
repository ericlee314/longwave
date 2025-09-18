import { useTranslation } from "react-i18next";
import { CenteredColumn, CenteredRow } from "./LayoutElements";

export function CommonFooter() {
  const { t } = useTranslation();

  return (
    <CenteredRow
      style={{
        paddingTop: 8,
        borderTop: "1px solid black",
        color: "gray",
        fontSize: "small",
      }}
    >
      <CenteredColumn>
        <p style={{ margin: 8 }}>
          <Link href="https://www.wavelength.zone" text="Wavelength" />{" "}
          {t("commonfooter.developed_by") as string}{" "}
          <Link
            href="https://github.com/cynicaloptimist/longwave"
            text={t("commonfooter.adapted_for_web") as string}
          />{" "}
          {t("commonfooter.adapted_for_web_by") as string}
        </p>
        {/* we want referrer, so: */}
        {/* eslint-disable-next-line react/jsx-no-target-blank */}
      </CenteredColumn>
    </CenteredRow>
  );
}

function Link(props: { href: string; text: string }) {
  return (
    <a href={props.href} target="_blank" rel="noopener noreferrer">
      {props.text}
    </a>
  );
}
