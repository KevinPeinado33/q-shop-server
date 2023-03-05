import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors, Get } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'

import { FilesService } from './files.service'
import { fileFilter, fileNamer } from './helpers'

@Controller('files')
export class FilesController {

  constructor(private readonly filesService: FilesService) { }

  @Get(':type')
  findProductImage() {

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

    return {
      fileName: file.originalname
    }
  
  }

}
