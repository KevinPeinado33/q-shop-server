import { Injectable } from '@nestjs/common'
import { NotFoundException } from '@nestjs/common/exceptions'
import { BadRequestException, InternalServerErrorException } from '@nestjs/common/exceptions'
import { Logger } from '@nestjs/common/services'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { validate as isUUID } from 'uuid'

import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { ProductImage, Product } from './entities'
import { PaginationDto } from '../common/dtos/pagination.dto'

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService')

  constructor(
    
    @InjectRepository(Product)
    private readonly productRepository: Repository< Product >,
    
    @InjectRepository(ProductImage)
    private readonly producImageRepository: Repository< ProductImage >,

    private readonly dataSource: DataSource

  ) { }

  async create(createProductDto: CreateProductDto) {

    try {

      const { images = [ ], ...productDetails } = createProductDto
      
      // en memoria me da el id y todo lo necesario
      const product = this.productRepository.create({ 
        ...productDetails,
        images: images.map( image => this.producImageRepository.create({ url: image }))
      })

      // ahora recien guardamos los datos en la bbdd
      await this.productRepository.save( product )

      return { ...product, images }

    } catch( error ) {
      this.handleDBExceptions( error )
    }

  }

  async findAll(
    paginationDto: PaginationDto
  ) {

    const { limit = 0, offset = 0 } = paginationDto

    const products = await this
                              .productRepository
                              .find({
                                take: limit,
                                skip: offset,
                                relations: {
                                  images: true
                                }
                              })

    return products.map( ({ images, ...rest }) => ({
      ...rest,
      images: images.map( img => img.url )
    }))

  }

  async findOne(term: string) {
    
    let product: Product

    if ( isUUID( term ) ) {
    
      product = await this.productRepository.findOneBy({ id: term })
    
    } else {
      
      const qryBuilder = this.productRepository.createQueryBuilder('prod')

      product = await qryBuilder
                        .where('UPPER(title) =:title or slug =:slug', {
                          title: term.toUpperCase(),
                          slug:  term.toLowerCase()
                        })
                        .leftJoinAndSelect('prod.images', 'prodImages')
                        .getOne()

    }

    if ( !product ) 
      throw new NotFoundException(`Product with id: #${ term } not found.`)
    
    return product

  }

  async findOnePlain(term: string) {

    const { images = [], ...rest } = await this.findOne( term )

    return {
      ...rest,
      images: images.map( img => img.url )
    }

  }

  async update(
    id: string, 
    updateProductDto: UpdateProductDto
  ) {

    const { images, ...toUpdate } = updateProductDto

    // buscar un produto con el id y carga las propieadades
    const product = await this.productRepository.preload({ id, ...toUpdate })

    if ( !product ) 
      throw new NotFoundException(`Producto with id: #${ id } not found`)

    const queryRunner = this.dataSource.createQueryRunner()
    
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {

      if ( images ) {
        
        await queryRunner.manager.delete( ProductImage, { product:{ id } })

        product.images = images.map( 
          img => this.producImageRepository.create({ url: img })
        )
      
      } else {
        product.images = await this.producImageRepository.findBy({ product: { id } })
      }

      await queryRunner.manager.save( product )
      
      // await this.productRepository.save( product )

      await queryRunner.commitTransaction()
      await queryRunner.release()
  
      return this.findOnePlain( id )

    } catch ( error ) {

      await queryRunner.rollbackTransaction()
      await queryRunner.release()

      this.handleDBExceptions( error )
    
    }

  }

  async remove(id: string) {
    
    const product = await this.findOne( id )
    await this.productRepository.remove( product )

  }

  async deleteAllProducts() {

    const query = this.productRepository.createQueryBuilder('product')

    try {

      return await query
                    .delete()
                    .where({})
                    .execute()

    } catch ( error ){
      this.handleDBExceptions( error )
    }

  }

  private handleDBExceptions ( error: any ) {
    
    if ( error.code === '23505' )
      throw new BadRequestException( error.detail )

    this.logger.error( error )
    throw new InternalServerErrorException('Unexpected error, check logs')
  
  }

}
