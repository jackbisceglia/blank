import { PropsWithChildren, useEffect, useState } from "react";
import { createZero } from ".";
import { ResultSuccess } from "../neverthrow";
import { ZeroProvider as ZeroProviderInternal } from "@rocicorp/zero/react";
import { useAuthentication } from "../auth/react";

export type ZeroInternal = ResultSuccess<ReturnType<typeof createZero>>;

const CAN_NOT_INSTANTIATE_ZERO = Symbol("CAN_NOT_INSTANTIATE_ZERO");
type CanNotInstantiateZero = typeof CAN_NOT_INSTANTIATE_ZERO;

export const ZeroProvider = (props: PropsWithChildren) => {
  const auth = useAuthentication();
  const [zero, setZero] = useState<ZeroInternal | CanNotInstantiateZero | null>(
    null
  );

  useEffect(() => {
    // TODO: I DON'T WANT TO DO THIS LIKE THIS
    createZero(auth.access).match(
      function success(z) {
        setZero(z);
      },
      function error() {
        setZero(CAN_NOT_INSTANTIATE_ZERO);
      }
    );
  }, []);

  if (zero === null) {
    return null;
  }

  if (zero === CAN_NOT_INSTANTIATE_ZERO) {
    return <div>Issue syncing data, please try again later</div>;
  }

  return (
    <ZeroProviderInternal zero={zero}>{props.children}</ZeroProviderInternal>
  );
};
