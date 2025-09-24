import { useHistory } from "react-router-dom";
import firebase from "firebase/app";
import "firebase/database";
import { RandomFourCharacterString } from "../../state/RandomFourCharacterString";
import { CenteredColumn, CenteredRow } from "./LayoutElements";
import { Button } from "./Button";
import { LongwaveAppTitle } from "./Title";

import { useTranslation } from "react-i18next";
import { allLanguages } from "../../i18n";
import { faLanguage } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "react-tippy";

export function LandingPage() {
  const { t } = useTranslation();

  const history = useHistory();
  async function generateUniqueRoomId(maxAttempts: number = 10): Promise<string> {
    for (let attemptIndex = 0; attemptIndex < maxAttempts; attemptIndex++) {
      const candidateRoomId = RandomFourCharacterString();
      try {
        const snapshot = await firebase
          .database()
          .ref("rooms/" + candidateRoomId)
          .once("value");
        if (!snapshot.exists()) {
          return candidateRoomId;
        }
      } catch (error) {
        // If Firebase check fails, fall back to the current candidate
        return candidateRoomId;
      }
    }
    // As a final fallback, return a fresh random ID
    return RandomFourCharacterString();
  }
  return (
    <CenteredColumn>
      <LongwaveAppTitle />
      <CenteredRow>
        <Button
          text={t("landingpage.create_room") as string}
          onClick={async () => {
            const uniqueRoomId = await generateUniqueRoomId();
            history.push("/" + uniqueRoomId);
          }}
        />
        <LanguageMenu />
      </CenteredRow>
      <p style={{ margin: 8 }}>
        <strong>{t("landingpage.longwave") as string}</strong>{" "}
        {t("landingpage.adaptation")} <em>{t("landingpage.wavelength") as string}</em>.{" "}
        {t("landingpage.best_enjoyed") as string}
      </p>
    </CenteredColumn>
  );
}

function LanguageMenu() {
  return (
    <Tooltip
      interactive
      position="bottom"
      sticky
      tabIndex={0}
      html={<Languages />}
    >
      <FontAwesomeIcon size="lg" icon={faLanguage} />
    </Tooltip>
  );
}

function Languages() {
  const { i18n } = useTranslation();

  return (
    <CenteredColumn
      style={{
        backgroundColor: "white",
        border: "1px solid black",
        padding: 6,
      }}
    >
      {allLanguages.map((language) => {
        return (
          <div
            key={language}
            style={{ cursor: "pointer" }}
            tabIndex={0}
            onClick={() => {
              i18n.changeLanguage(language);
            }}
          >
            {language}
          </div>
        );
      })}
    </CenteredColumn>
  );
}
