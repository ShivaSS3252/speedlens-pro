import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class Fix {
  @Prop() language: string;
  @Prop() code: string;
  @Prop() explanation: string;
}
export const FixSchema = SchemaFactory.createForClass(Fix);

@Schema({ _id: false })
export class Issue {
  @Prop() id: string;
  @Prop() title: string;
  @Prop() description: string;
  @Prop() displayValue: string;
  @Prop({ type: FixSchema }) fix: Fix;
}
export const IssueSchema = SchemaFactory.createForClass(Issue);

@Schema({ _id: false })
export class Suggestion {
  @Prop() id: string;
  @Prop() title: string;
  @Prop() description: string;
}
export const SuggestionSchema = SchemaFactory.createForClass(Suggestion);

@Schema({ id: false })
export class Report extends Document {
  @Prop({ required: true, unique: true }) id: string;
  @Prop() url: string;
  @Prop() mobileScore: number;
  @Prop() desktopScore: number;
  @Prop({ type: [IssueSchema] }) issues: Issue[];
  @Prop({ type: [SuggestionSchema] }) suggestions: Suggestion[];
  @Prop() techStack: string;
  @Prop() createdAt: string;
}
export const ReportSchema = SchemaFactory.createForClass(Report);
