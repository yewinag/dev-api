import { Injectable } from '@nestjs/common';
import { ClientSession, Schema as MongooseSchema } from 'mongoose';
import { GetQueryDto } from '../../dto/getQueryDto';
import { ClientRespository } from '../../repositories/client.respository';
import { CreateClientDto } from './dto/createClient.dto';
import { UpdateClientDto } from './dto/updateClient.dto';

@Injectable()
export class ClientService {
  constructor(private readonly clientRespository: ClientRespository) {}

  async createClient(createClientDto: CreateClientDto, session: ClientSession) {
    return await this.clientRespository.createClient(createClientDto, session);
  }

  async getClientUsers(token: string, getQueryDto: GetQueryDto) {
    return await this.clientRespository.getClientUsers(token, getQueryDto);
  }

  async getClientUserById(id: string) {
    return await this.clientRespository.getClientUserById(id);
  }
  async getClientUserByPhoneNumber(phoneNumber: string) {
    return await this.clientRespository.getClientByPhoneNumber(phoneNumber);
  }

  async updateClient(
    id: MongooseSchema.Types.ObjectId,
    updtaeClientDto: UpdateClientDto,
  ) {
    return await this.clientRespository.updateClient(id, updtaeClientDto);
  }
}
