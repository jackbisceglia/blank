import { Route } from "../page";
import * as v from "valibot";
import { constants, SearchRouteStep1, SearchRouteStep2 } from "./route";

export function useValidateDialogProgression(activeExpenseCount: number) {
  const routes = [
    SearchRouteStep1.useSearchRoute(),
    SearchRouteStep2.useSearchRoute(),
  ];
  const navigate = Route.useNavigate();
  const search = Route.useSearch({
    select(state) {
      return state[constants.key];
    },
  });

  function validate() {
    if (!search?.length) return true;
    if (activeExpenseCount <= 0) return false;

    const current = v.safeParse(
      // parses the progression of steps, validates they're correctly in order, returns the current step
      v.pipe(
        v.array(v.string()),
        v.everyItem((s) => s.startsWith(constants.prefix)),
        v.transform((value) => value.map((s) => s.split("-").at(1))),
        v.nonNullable(v.array(v.string())),
        v.transform((value) => value.map((s) => parseInt(s))),
        v.checkItems((item, index, array) => {
          if (item !== index + 1) return false;

          if (index === array.length - 1) return true;

          return item === array[index + 1] - 1;
        }),
        v.transform((value) => value.at(-1)),
        v.nonNullable(v.number()),
        v.integer(),
      ),
      search,
    );

    return current.success;
  }

  const reset = () => {
    void navigate({
      to: ".",
      search: (previous) => ({
        ...previous,
        [constants.key]: undefined,
      }),
    });
  };

  function getNextStep(step: number) {
    if (step === routes.length) {
      return reset;
    }

    const next = routes.at(step)?.open;

    if (!next) {
      throw new Error(
        `Step ${(step + 1).toString()} is not a valid step. Please close the dialog and try again.`,
      );
    }

    return next;
  }

  function getPreviousStep(step: number) {
    if (step === 0) {
      return reset;
    }

    const previous = routes.at(step - 1)?.close;

    if (!previous) {
      throw new Error(
        `Step ${(step - 1).toString()} is not a valid step. Please close the dialog and try again.`,
      );
    }

    return previous;
  }

  return {
    validate,
    getNextStep,
    getPreviousStep,
    routes,
  };
}
