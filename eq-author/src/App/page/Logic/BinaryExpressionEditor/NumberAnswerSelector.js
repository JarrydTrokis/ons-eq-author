import React from "react";
import styled from "styled-components";
import PropTypes from "prop-types";
import { get, some } from "lodash";

import { colors, radius } from "constants/theme";
import { Number, Select, Label } from "components/Forms";
import VisuallyHidden from "components/VisuallyHidden";

import { rightSideErrors } from "constants/validationMessages";
import { ValidationError } from "components/Error";

const conditions = {
  EQUAL: "Equal",
  NOT_EQUAL: "NotEqual",
  GREATER_THAN: "GreaterThan",
  LESS_THAN: "LessThan",
  GREATER_OR_EQUAL: "GreaterOrEqual",
  LESS_OR_EQUAL: "LessOrEqual",
  UNANSWERED: "Unanswered",
};

export const ConditionSelector = styled(Select)`
  width: auto;
`;

const Value = styled.div`
  flex: 1 1 auto;
  display: flex;
  margin-left: 1em;
  align-items: center;
  position: relative;
`;

const NumberAnswerRoutingSelector = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid ${colors.lightGrey};
  margin: 1em 0;
  border-radius: ${radius};
  padding: 1em;
  ${({ hasError }) =>
    hasError &&
    `
    border-color: ${colors.red};
    outline-color: ${colors.red};
    box-shadow: 0 0 0 2px ${colors.red};
    border-radius: 4px;
    margin-bottom: 0.5em;
  `}
`;

class NumberAnswerSelector extends React.Component {
  static propTypes = {
    expression: PropTypes.shape({
      id: PropTypes.string.isRequired,
      left: PropTypes.shape({
        type: PropTypes.string.isRequired,
      }).isRequired,
      right: PropTypes.shape({
        number: PropTypes.number.isRequired,
      }),
    }).isRequired,
    onRightChange: PropTypes.func.isRequired,
    onConditionChange: PropTypes.func.isRequired,
  };

  state = {
    number: get(this.props.expression, "right.number", null),
  };

  handleRightChange = ({ value }) => this.setState(() => ({ number: value }));

  handleRightBlur = () => {
    this.props.onRightChange({ customValue: { number: this.state.number } });
  };

  handleConditionChange = ({ value }) => {
    this.props.onConditionChange(value);
  };

  handleError = () => {
    return (
      <ValidationError right>
        {rightSideErrors.ERR_RIGHTSIDE_NO_VALUE.message}
      </ValidationError>
    );
  };

  render() {
    const { expression } = this.props;

    const hasError = some(expression.validationErrorInfo.errors, {
      errorCode: rightSideErrors.ERR_RIGHTSIDE_NO_VALUE.errorCode,
    });

    return (
      <>
        <NumberAnswerRoutingSelector hasError={hasError}>
          <VisuallyHidden>
            <Label htmlFor={`expression-condition-${expression.id}`}>
              Operator
            </Label>
          </VisuallyHidden>
          <ConditionSelector
            id={`expression-condition-${expression.id}`}
            onChange={this.handleConditionChange}
            name="condition-select"
            value={expression.condition}
            data-test="condition-selector"
          >
            <option value={conditions.EQUAL}>(=) Equal to</option>
            <option value={conditions.NOT_EQUAL}>(&ne;) Not equal to</option>
            <option value={conditions.GREATER_THAN}>(&gt;) More than</option>
            <option value={conditions.LESS_THAN}>(&lt;) Less than</option>
            <option value={conditions.GREATER_OR_EQUAL}>
              (&ge;) More than or equal to
            </option>
            <option value={conditions.LESS_OR_EQUAL}>
              (&le;) Less than or equal to
            </option>
            <option value={conditions.UNANSWERED}>Unanswered</option>
          </ConditionSelector>
          {expression.condition !== conditions.UNANSWERED && (
            <>
              <Value>
                <VisuallyHidden>
                  <Label htmlFor={`expression-right-${expression.id}`}>
                    Value
                  </Label>
                </VisuallyHidden>
                <Number
                  default={null}
                  id={`expression-right-${expression.id}`}
                  min={-99999999}
                  max={999999999}
                  placeholder="Value"
                  value={this.state.number}
                  name={`expression-right-${expression.id}`}
                  onChange={this.handleRightChange}
                  onBlur={this.handleRightBlur}
                  data-test="number-value-input"
                  type={expression.left.type}
                  unit={get(expression.left, "properties.unit", null)}
                />
              </Value>
            </>
          )}
        </NumberAnswerRoutingSelector>
        {hasError && this.handleError()}
      </>
    );
  }
}

export default NumberAnswerSelector;
