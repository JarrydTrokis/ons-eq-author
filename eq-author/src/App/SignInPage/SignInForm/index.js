import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import auth from "components/Auth";

import {
  PageTitle,
  Description,
  CheckBoxField,
  CheckboxInput,
  ButtonLink,
} from "components-themed/Toolkit";
import PasswordInput from "components-themed/Input/PasswordInput";
import Input from "components-themed/Input";
import Button from "components-themed/buttons";
import Label, { OptionLabel } from "components-themed/Label";
import Panel from "components-themed/panels";

import { Field } from "components/Forms";

const SignInForm = ({
  setForgotPassword,
  setCreateAccountFunction,
  errorMessage,
  setErrorMessage,
  passwordResetSuccess,
  setPasswordResetSuccess,
  emailNowVerified,
  setEmailNowVerified,
}) => {
  const logInWithEmailAndPassword = (email, password) => {
    setPasswordResetSuccess(false);
    setEmailNowVerified(false);
    if (email === "") {
      setErrorMessage("Enter email");
      return;
    } else if (password === "") {
      setErrorMessage("Enter password");
      return;
    }
    auth
      .signInWithEmailAndPassword(email, password)
      .then(() => setForgotPassword(false))
      .catch((error) => {
        setErrorMessage(error.message);
      });
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [checkbox, setCheckbox] = useState(false);

  let errorRef = useRef();

  function handleRecoverPassword(e) {
    e.preventDefault();
    setForgotPassword(true);
    setErrorMessage("");
  }

  function handleCreateAccount(e) {
    e.preventDefault();
    setCreateAccountFunction(true);
    setForgotPassword(false);
    setErrorMessage("");
  }

  function handleLinkToAnchor() {
    if (errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <>
      {errorMessage && (
        <Panel
          variant="errorWithHeader"
          headerLabel="This page has an error"
          paragraphLabel={errorMessage}
          withList
          handleLinkToAnchor={handleLinkToAnchor}
        />
      )}
      <PageTitle>Sign in</PageTitle>
      <Description>You must be signed in to access Author</Description>
      {passwordResetSuccess && (
        <Panel variant="success" headerLabel="boom" withLeftBorder>
          {"You've successfully updated the password for your Author account."}
        </Panel>
      )}
      {emailNowVerified && (
        <Panel variant="success" headerLabel="boom" withLeftBorder>
          {"You've successfully verified your Author account."}
        </Panel>
      )}

      <Field>
        {errorMessage?.toLowerCase().includes("email") ? (
          <>
            <Panel
              variant="errorNoHeader"
              paragraphLabel={errorMessage}
              withLeftBorder
              innerRef={errorRef}
            >
              <Label htmlFor="email">Email address</Label>
              <Input
                type="text"
                id="email"
                value={email}
                onChange={({ value }) => setEmail(value)}
                data-test="txt-email"
              />
            </Panel>
          </>
        ) : (
          <>
            <Label htmlFor="email">Email address</Label>
            <Input
              type="text"
              id="email"
              value={email}
              onChange={({ value }) => setEmail(value)}
              data-test="txt-email"
            />
          </>
        )}
      </Field>
      <Field>
        {errorMessage?.toLowerCase().includes("password") ? (
          <>
            <Panel
              variant="errorNoHeader"
              paragraphLabel={errorMessage}
              withLeftBorder
              innerRef={errorRef}
            >
              <PasswordInput
                id="password"
                value={password}
                onChange={({ value }) => setPassword(value)}
                data-test="txt-password"
              />
            </Panel>
          </>
        ) : (
          <>
            <PasswordInput
              id="password"
              value={password}
              onChange={({ value }) => setPassword(value)}
              data-test="txt-password"
            />
          </>
        )}
      </Field>
      <Field>
        <ButtonLink
          onClick={handleRecoverPassword}
          name="recover-password-button"
        >
          Forgot your password?
        </ButtonLink>
      </Field>

      <CheckBoxField>
        <CheckboxInput
          type="checkbox"
          id="signIn-checkbox"
          name="signInCheckbox"
          checked={checkbox}
          onChange={({ checked }) => setCheckbox(checked)}
        />
        <OptionLabel htmlFor="signIn-checkbox">
          {"Keep me signed in"}
        </OptionLabel>
      </CheckBoxField>
      <Field>
        <Button
          onClick={() => logInWithEmailAndPassword(email, password)}
          name="sign-in"
          type="button"
          data-test="signIn-button"
        >
          Sign in
        </Button>
      </Field>
      <ButtonLink onClick={handleCreateAccount}>
        Create an Author account
      </ButtonLink>
    </>
  );
};

SignInForm.defaultProps = {
  firebaseAuth: auth,
};

SignInForm.propTypes = {
  setForgotPassword: PropTypes.func,
  setCreateAccountFunction: PropTypes.func,
  errorMessage: PropTypes.string,
  setErrorMessage: PropTypes.func,
  passwordResetSuccess: PropTypes.bool,
  setPasswordResetSuccess: PropTypes.func,
  emailNowVerified: PropTypes.bool,
  setEmailNowVerified: PropTypes.func,
};

export default SignInForm;
