import { Injectable } from '@nestjs/common'
import { BadRequestException, InternalServerErrorException } from '@nestjs/common/exceptions';
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import bcrypt from 'bcrypt'

import { CreateUserDto } from './dto/create-user.dto'
import { User } from './entities/user.entity'

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository< User >
  ) { }

  async create(createUserDto: CreateUserDto) {
    
    try {

      const user = this.userRepository.create( createUserDto )

      await this.userRepository.save( user )

      return user

    } catch ( error ) {
      this.handleDBErrors( error )
    }

  }

  private handleDBErrors( error: any ): never {
    
    if ( error.code === '23505' )
      throw new BadRequestException( error.detail )

    throw new InternalServerErrorException('Please check server logs')

  }

}
