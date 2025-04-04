import { RequestContext } from "@mikro-orm/core";
import { User } from "./../../db/entity";
import { UserRepository } from "./../../db/repository";

class UserService {
  private readonly userRepository: UserRepository;

  constructor() {
    this.userRepository =
      RequestContext.getEntityManager()!.getRepository(User);
  }

  async register(payload: any) {
    // validations
  }
}
