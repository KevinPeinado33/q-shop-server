import { Injectable } from '@nestjs/common'
import { NotFoundException } from '@nestjs/common/exceptions'
import { BadRequestException, InternalServerErrorException } from '@nestjs/common/exceptions'
import { Logger } from '@nestjs/common/services'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { validate as isUUID } from 'uuid'

import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { Product } from './entities/product.entity'
import { PaginationDto } from '../common/dtos/pagination.dto';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService')

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository< Product >
  ) { }

  async create(createProductDto: CreateProductDto) {

    try {
      
      // en memoria me da el id y todo lo necesario
      const product = this.productRepository.create( createProductDto )

      // ahora recien guardamos los datos en la bbdd
      await this.productRepository.save( product )

      return product

    } catch( error ) {
      this.handleDBExceptions( error )
    }

  }

  // TODO: paginar
  findAll(
    paginationDto: PaginationDto
  ) {

    const { limit = 0, offset = 0 } = paginationDto

    return this
            .productRepository
            .find({
              take: limit,
              skip: offset
            })
  }

  async findOne(term: string) {
    
    let product: Product

    if ( isUUID( term ) ) {
    
      product = await this.productRepository.findOneBy({ id: term })
    
    } else {
      
      const qryBuilder = this.productRepository.createQueryBuilder()

      product = await qryBuilder
                        .where('UPPER(title) =:title or slug =:slug', {
                          title: term.toUpperCase(),
                          slug: term.toLowerCase()
                        })
                        .getOne()

    }

    if ( !product ) {
      throw new NotFoundException(`Product with id: #${ term } not found.`)
    }

    return product

  }

  async update(
    id: string, 
    updateProductDto: UpdateProductDto
  ) {

    // buscar un produto con el id y carga las propieadades
    const product = await this.productRepository.preload({
      id,
      ...updateProductDto
    })

    if ( !product ) throw new NotFoundException(`Producto with id: #${ id } not found`)

    try {
      
      await this.productRepository.save( product )
  
      return product

    } catch ( error ) {
      this.handleDBExceptions( error )
    }

  }

  async remove(id: string) {
    
    const product = await this.findOne( id )
    await this.productRepository.remove( product )

  }

  private handleDBExceptions ( error: any ) {
    
    if ( error.code === '23505' )
      throw new BadRequestException( error.detail )

    this.logger.error( error )
    throw new InternalServerErrorException('Unexpected error, check logs')
  
  }

}
