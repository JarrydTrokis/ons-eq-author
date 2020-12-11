import React from "react";

import NoRouting from "./NoRouting";
import { render, fireEvent, screen } from "tests/utils/rtl";
import QuestionnaireContext from "components/QuestionnaireContext";
import { buildQuestionnaire } from "tests/utils/createMockQuestionnaire";

describe("components/NoRouting", () => {
  const disabledTitle = "Routing is not available for this quesiton";
  const disabledParagraph =
    "You can't route on the last question in a questionnaire.";
  const enabledTitle = "No routing rules exist for this question";
  const enabledParagraph =
    "Users completing this question will be taken to the next page.";
  const questionnaire = buildQuestionnaire({ pageCount: 2 });

  it("should render with button enabled", () => {
    const page = questionnaire.sections[0].folders[0].pages[0];

    const { queryByText } = render(
      <QuestionnaireContext.Provider value={{ questionnaire }}>
        <NoRouting onAddRouting={jest.fn()} title="Test" page={page}>
          Ullamcorper Venenatis Fringilla
        </NoRouting>
      </QuestionnaireContext.Provider>
    );

    expect(queryByText(enabledTitle)).toBeTruthy();
    expect(queryByText(enabledParagraph)).toBeTruthy();
    expect(queryByText(disabledTitle)).toBeFalsy();
    expect(queryByText(disabledParagraph)).toBeFalsy();

    expect(screen.getByTestId("btn-add-routing")).not.toHaveStyle(
      `pointer-events: none; 
       opacity: 0.6;`
    );
    expect(screen.getByTestId("btn-add-routing")).not.toHaveAttribute(
      "disabled"
    );
  });

  it("should render with button disabled", () => {
    const page = questionnaire.sections[0].folders[0].pages[1];

    const { queryByText } = render(
      <QuestionnaireContext.Provider value={{ questionnaire }}>
        <NoRouting onAddRouting={jest.fn()} title="Test" page={page}>
          Ullamcorper Venenatis Fringilla
        </NoRouting>
      </QuestionnaireContext.Provider>
    );

    expect(queryByText(disabledTitle)).toBeTruthy();
    expect(queryByText(disabledParagraph)).toBeTruthy();
    expect(queryByText(enabledTitle)).toBeFalsy();
    expect(queryByText(enabledParagraph)).toBeFalsy();

    expect(screen.getByTestId("btn-add-routing")).toHaveStyle(
      `pointer-events: none; 
       opacity: 0.6;`
    );
    expect(screen.getByTestId("btn-add-routing")).toHaveAttribute("disabled");
  });

  it("should call onAddRouting when button clicked", () => {
    const page = questionnaire.sections[0].folders[0].pages[0];
    const onAddRouting = jest.fn();

    const { getByTestId } = render(
      <QuestionnaireContext.Provider value={{ questionnaire }}>
        <NoRouting onAddRouting={onAddRouting} title="Test" page={page}>
          Ullamcorper Venenatis Fringilla
        </NoRouting>
      </QuestionnaireContext.Provider>
    );
    expect(screen.getByTestId("btn-add-routing")).not.toHaveAttribute(
      "disabled"
    );
    const button = getByTestId("btn-add-routing");
    fireEvent.click(button);
    expect(onAddRouting).toHaveBeenCalledTimes(1);
  });
});
