"use client";

import { AppProgressBar } from "next-nprogress-bar";

export function NavigationProgress() {
  return (
    <>
      <AppProgressBar
        height="4px"
        color="#4CA771"
        options={{ showSpinner: false }}
        shallowRouting
      />
      <style jsx global>{`
        #nprogress .bar {
          z-index: 9999 !important;
          background: #4ca771 !important;
        }
        #nprogress .peg {
          box-shadow: 0 0 10px #4ca771, 0 0 5px #4ca771 !important;
        }
      `}</style>
    </>
  );
}
