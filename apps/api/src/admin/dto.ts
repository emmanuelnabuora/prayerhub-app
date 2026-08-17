import { IsIn, IsUUID } from 'class-validator';

export class GrantRoleDto {
  @IsUUID() userId: string;
  @IsIn(['moderator', 'admin', 'super_admin']) role: 'moderator' | 'admin' | 'super_admin';
}
