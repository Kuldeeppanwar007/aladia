export class UserRto {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: any): UserRto {
    // 'any' for flexibility with Mongoose doc
    const rto = new UserRto();
    rto.id = entity._id?.toString() || entity.id;
    rto.email = entity.email;
    rto.name = entity.name;
    rto.createdAt = entity.createdAt;
    rto.updatedAt = entity.updatedAt;
    return rto;
  }
}
