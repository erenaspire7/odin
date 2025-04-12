import { RequestContext } from "@mikro-orm/core";
import { User, UserRepository } from "@odin/core/db";
import { isAddress } from "ethers";
import { RegisterUserPayload } from "@odin/core/types";

export class UserService {
  private readonly userRepository: UserRepository;

  constructor() {
    this.userRepository =
      RequestContext.getEntityManager()!.getRepository(User);
  }

  async register(payload: RegisterUserPayload) {
    const { walletAddress } = payload;

    if (!isAddress(walletAddress)) {
      throw new Error("Invalid wallet address");
    }

    const user = await this.userRepository.findOne({ walletAddress });

    if (user) {
      return user;
    }

    return this.userRepository.createUser(payload);
  }
}
