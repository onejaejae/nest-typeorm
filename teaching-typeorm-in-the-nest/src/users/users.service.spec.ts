import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import { UserRegisterDTO } from './dtos/user-register.dto'
import { UserEntity } from './users.entity'
import { UsersService } from './users.service'

const mockUserId = 'c1f0e942-af78-4460-b3cc-4b0f6bfc1174'
const mockJwt = 'thisisjwt'

const password = '1205'

const mockUser = {
  id: mockUserId,
  email: 'me@amamov.com',
  username: 'amamov',
  password: bcrypt.hashSync(password, 10),
  isAdmin: false,
}

class MockUsersRepository {
  save = jest.fn().mockResolvedValue(mockUser)

  async findOne(where: { id?: string; email?: string }) {
    if (where?.id === mockUserId) return mockUser
    else if (where?.email === mockUser.email) return mockUser
    else return null
  }
}

const mockJwtService = () => ({
  signAsync: jest.fn().mockResolvedValue(mockJwt),
})

const mockConfigService = () => ({
  get: jest.fn().mockReturnValue('thisissecretkey'),
})

describe('UsersService', () => {
  let usersService: UsersService
  let usersRepository: MockUsersRepository
  let jwtService: JwtService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService, // { provide : UsersService, useClass : UsersService }
        {
          provide: getRepositoryToken(UserEntity),
          useClass: MockUsersRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService(),
        },
        {
          provide: ConfigService,
          useValue: mockConfigService(),
        },
      ],
    }).compile()

    usersService = module.get<UsersService>(UsersService)
    jwtService = module.get<JwtService>(JwtService)
    usersRepository = module.get(getRepositoryToken(UserEntity))
  })

  it('UsersService should be defined', () => {
    expect(usersService).toBeDefined()
  })

  describe('registerUser function', () => {
    const newUser: UserRegisterDTO = {
      email: 'new@amamov.com',
      password: '1205',
      username: 'new',
    }
    const existedUser: UserRegisterDTO = {
      email: mockUser.email,
      password: mockUser.password,
      username: mockUser.username,
    }

    it('should be defined', () => {
      expect(usersService.registerUser).toBeDefined()
    })

    it('?????? ????????? ???????????? ???????????? ????????? DB?????? ????????? ????????? ??????.', async () => {
      expect(usersRepository.findOne).toBeDefined()
      expect(usersService.registerUser(newUser)).resolves
      await expect(
        usersService.registerUser(existedUser),
      ).rejects.toThrowError()
    })

    it('?????? ????????? ????????? ?????? ????????? ????????? ???????????? ???????????? ???????????? ?????????.', async () => {
      await expect(usersService.registerUser(newUser)).resolves.toBeUndefined()
    })
  })

  describe('verifyUserAndSignJwt function', () => {
    it('should be defined', () => {
      expect(usersService.verifyUserAndSignJwt).toBeDefined()
    })

    it('jwtService should be defined', () => {
      expect(jwtService.signAsync).toBeDefined()
    })

    it('???????????? ????????? ?????? ????????? 400 ????????? ???????????????.', async () => {
      try {
        await usersService.verifyUserAndSignJwt(
          'nothing@amamov.com',
          mockUser.password,
        )
        throw new Error('????????? ??????')
      } catch (error) {
        expect(error.message).toBe('???????????? ???????????? ???????????? ????????????.')
      }
    })

    it('???????????? ??????????????? ??????????????? ?????? ??????.', async () => {
      try {
        await usersService.verifyUserAndSignJwt(
          mockUser.email,
          mockUser.password,
        )
        throw new Error('????????? ??????')
      } catch (error) {
        expect(error.message).toBe('???????????? ?????????????????????.')
      }
      try {
        await usersService.verifyUserAndSignJwt(mockUser.email, password)
      } catch (error) {
        expect(error.message).toBeUndefined()
      }
    })

    it('?????? ??????????????? ???????????? ????????? ???????????????.', async () => {
      try {
        await usersService.verifyUserAndSignJwt(mockUser.email, '1205!')
        throw new Error('????????? ??????')
      } catch (error) {
        expect(error.message).toBe('???????????? ?????????????????????.')
      }
    })

    it('????????? JWT??? UserDTO??? ????????????.', async () => {
      try {
        const user = await usersService.verifyUserAndSignJwt(
          mockUser.email,
          password,
        )
        expect(user).toEqual({
          jwt: mockJwt,
          user: mockUser,
        })
      } catch (error) {
        expect(error).toBeUndefined()
      }
    })
  })

  describe('findUserById function', () => {
    it('should be defined', () => {
      expect(usersService.findUserById).toBeDefined()
    })

    it('id??? DB??? ???????????? User??? ?????????.', async () => {
      await expect(usersService.findUserById(mockUserId)).resolves.toEqual(
        mockUser,
      )
    })

    it('id??? DB??? ???????????? ?????? User??? ?????? ??????, 400 ????????? ???????????????.', async () => {
      await expect(usersService.findUserById('fakeid')).rejects.toThrowError()
    })
  })
})
