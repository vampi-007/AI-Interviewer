# AI-Interviewer

## User Flow
![image](https://github.com/user-attachments/assets/357e60b7-83d3-4fe8-b1d0-750ef5ce4411)

## API
![image](https://github.com/user-attachments/assets/ab6d39e6-ee32-477c-97e2-800fbb36339d)

## Diagram
![image](https://github.com/user-attachments/assets/74d4d3cf-294e-4412-9f94-0a850b315bdd)

## Schema

model User {
  user_id    String      @id @unique @default(uuid())
  name       String
  username   String      @unique
  password   String
  created_at DateTime    @default(now())
  updated_at DateTime?   @updatedAt
  email      String      @unique
  role       Role        @default(USER)
  Interview  Interview[]
  Resumes    Resumes[]
}

model Interview {
  interview_id        Int
  start               DateTime
  end                 DateTime?
  duration            Int?
  transcript          String?
  summary             String?
  recording_url       String?
  video_recording_url String?
  created_at          DateTime? @default(now())
  success_evaluation  Int?
  resume_id           Resumes   @relation(fields: [resumesResume_id], references: [resume_id])
  user_id             User      @relation(fields: [userUser_id], references: [user_id])
  resumesResume_id    String
  userUser_id         String
}

model Resumes {
  resume_id      String      @id @unique @default(uuid())
  resume_data    Json?
  uploaded_at    DateTime?   @default(now())
  token          String?
  token_expiry   DateTime
  is_valid       Boolean
  is_interviewed Boolean
  user_id        User        @relation(fields: [userUser_id], references: [user_id])
  Interview      Interview[]
  userUser_id    String
}

model Prompt {
  prompt_id  Int       @id @unique @default(autoincrement())
  name       String?
  content    String?
  created_at DateTime? @default(now())
  updated_at DateTime?
  category   String?
}

model TechStackPrompts {
  tech_prompt_id   String     @id @unique @default(uuid())
  tech_stack       String?
  difficulty       Difficulty @default(easy)
  generated_prompt String
  created_at       DateTime?  @default(now())
}

enum Difficulty {
  easy
  medium
  hard
}

enum Role {
  ADMIN
  USER
}


