# Trust Calibration Lab

A small, dependency-free HCI experiment that helps people practise calibrated reliance on AI recommendations.

## The problem

AI interfaces often show a confidence score without helping people judge the quality of the underlying evidence, the cost of an error, or whether a decision is reversible. High confidence can become a shortcut for trust.

## The experiment

Participants review five recommendation scenarios across navigation, health, research, accessibility, and analytics. For each scenario they:

1. choose **Accept**, **Verify**, or **Reject**;
2. report confidence from 50–100%;
3. receive an immediate rationale;
4. see an accuracy-to-confidence calibration gap at the end.

## UX decisions

- Makes model confidence, evidence quality, data freshness, and potential harm visible.
- Separates *decision accuracy* from *self-reported confidence*.
- Uses immediate feedback to support reflection without interrupting the first judgment.
- Includes semantic HTML, visible focus states, keyboard support, `aria-live` feedback, high contrast, responsive layouts, and reduced-motion support.
- Stores no personal data and requires no account or external dependency.

## Run locally

Open `index.html` in any modern browser.

## Stack

HTML · CSS · Vanilla JavaScript

## What I learned

Trust is not a single attitude to maximise. A useful AI interface should help people match their reliance to evidence quality, uncertainty, reversibility, and potential harm.

Designed and built by **Soroush Etemadfar** · September 2026
