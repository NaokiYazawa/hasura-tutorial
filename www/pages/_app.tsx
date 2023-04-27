import "@/styles/globals.css";
import type { AppProps } from "next/app";
import withUrql from "@/utils/client";

function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default withUrql(App);
