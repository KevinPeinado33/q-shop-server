import { 
    IsString, 
    MinLength,
    IsNumber,
    IsPositive,
    IsOptional,
    IsInt,
    IsIn
} from 'class-validator'
import { IsArray } from 'class-validator'

export class CreateProductDto {
    
    @IsString()
    @MinLength(6)
    title       : string

    @IsNumber()
    @IsPositive()
    @IsOptional()
    price?      : number

    @IsString()
    @IsOptional()
    description?: string

    @IsString()
    @IsOptional()
    slug?       : string

    @IsInt()
    @IsPositive()
    @IsOptional()
    stock?      : number
    
    @IsString({ each: true })
    @IsArray()
    @IsOptional()
    sizes       : string[]

    @IsIn(['men', 'women', 'kid', 'unisex'])
    gender      : string

    @IsString({ each: true })
    @IsArray()
    @IsOptional()
    tags?       : string[]

}
