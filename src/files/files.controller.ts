import { Response } from 'express'
import { 
  BadRequestException, 
  Controller, 
  Post, 
  UploadedFile, 
  UseInterceptors, 
  Get, 
  Param, 
  Res 
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'

import { FilesService } from './files.service'
import { fileFilter, fileNamer } from './helpers'
import { ConfigService } from '@nestjs/config'

@Controller('files')
export class FilesController {

  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService
  ) { }

  @Get('product/:imageName')
  findProductImage(
    @Res() response              : Response,
    @Param('imageName') imageName: string
  ) {

    const path = this.filesService.getStaticProductImage( imageName )

    response.sendFile( path )

  }

  @Post('product')
  @UseInterceptors( FileInterceptor('file', {
    fileFilter: fileFilter,
    /* limits: { fileSize: 1000 } */ 
    storage: diskStorage({
      destination: './static/products',
      filename: fileNamer
    })
  }) )
  uploadProductImage( 
    @UploadedFile() file: Express.Multer.File
  ) {

    if ( !file )
      throw new BadRequestException('Make sure that the file is an image')

    const hostname = this.configService.get('HOST_API')
    const secureURL = `${ hostname }:3000/api/file/product/${ file.filename }`

    return {
      fileName: file.originalname
    }
  
  }

}
