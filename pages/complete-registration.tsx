import dynamic from "next/dynamic";

const CompleteRegistration = dynamic(
  () => import("../components/CompleteRegistration"),
  { ssr: false }
);

export default CompleteRegistration;
