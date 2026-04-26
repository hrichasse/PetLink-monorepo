import { getUserByIdController } from "@/modules/users/controllers";
import { withErrorHandler } from "@petlink/shared";

type UserIdRouteParams = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, context: UserIdRouteParams) {
  return withErrorHandler(() => getUserByIdController(context));
}