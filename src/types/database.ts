// =============================================
// 513 HUB — Database Types
// =============================================

export type UserRole =
  | "admin"
  | "social_manager"
  | "creative_copy"
  | "creative_art"
  | "editor_designer"
  | "client";

export type ContentType = "reel" | "carousel_animated" | "carousel_static";

export type Platform = "instagram" | "tiktok" | "linkedin";

export type ContentStatus =
  | "planning"
  | "briefed"
  | "ideation"
  | "idea_approved"
  | "pre_production"
  | "production"
  | "internal_review"
  | "client_review"
  | "client_approved"
  | "client_changes"
  | "rework"
  | "scheduled"
  | "published";

export type IdeaStatus = "draft" | "proposed" | "approved" | "rejected";

export type ReviewStatus = "approved" | "changes_requested" | "rejected";

export type CommentType = "design" | "copy" | "concept" | "minor";

export type AIGenerationSource =
  | "higgsfield_veo"
  | "higgsfield_kling"
  | "higgsfield_nanobananapro"
  | "higgsfield_seedream"
  | "manual";

// =============================================
// v1.5 — Multi-tenant / Batches / Portal enums
// =============================================

export type WorkspaceRole =
  | "owner"
  | "admin"
  | "social_manager"
  | "creative_copy"
  | "creative_art"
  | "editor_designer"
  | "client_viewer";

export type BatchStatus =
  | "draft"
  | "sent"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "partially_approved"
  | "archived";

export type InviteStatus = "pending" | "accepted" | "expired" | "revoked";

export type ActivityEventType =
  | "piece.created"
  | "piece.status_changed"
  | "piece.updated"
  | "piece.deleted"
  | "briefing.created"
  | "briefing.updated"
  | "asset.uploaded"
  | "asset.deleted"
  | "comment.created"
  | "comment.resolved"
  | "batch.created"
  | "batch.sent"
  | "batch.opened"
  | "batch.approved"
  | "batch.rejected"
  | "batch.commented"
  | "member.invited"
  | "member.joined"
  | "member.removed";

export type ClientDecision = "approved" | "rejected" | "changes_requested";

// =============================================
// Table Types
// =============================================

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  email: string;
  created_at: string;
}

export interface Client {
  id: string;
  workspace_id: string;
  name: string;
  brand_guidelines: BrandGuidelines | null;
  google_drive_folder_id: string | null;
  logo_url: string | null;
  created_at: string;
}

export interface BrandGuidelines {
  colors: { name: string; hex: string }[];
  typography: { name: string; usage: string }[];
  tone: string;
  dos: string[];
  donts: string[];
}

export interface CarModel {
  id: string;
  workspace_id: string;
  client_id: string;
  name: string;
  category: string | null;
  year: number | null;
  key_technologies: string[];
  tech_specs: Record<string, string> | null;
  reference_images: string[];
  created_at: string;
  // Relations
  client?: Client;
}

export interface ContentPiece {
  id: string;
  workspace_id: string;
  client_id: string;
  car_model_id: string | null;
  piece_number: number | null;
  content_type: ContentType;
  platforms: string[];
  publish_date: string | null;
  status: ContentStatus;
  title: string | null;
  description: string | null;
  visual_description: string | null;
  copy_out: string | null;
  assigned_to: string[];
  created_by: string | null;
  briefing_id: string | null;
  month_year: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  client?: Client;
  car_model?: CarModel;
  briefing?: Briefing;
  ideas?: Idea[];
  assets?: Asset[];
  production_tasks?: ProductionTask[];
  reviews?: Review[];
  comments?: Comment[];
}

export interface Briefing {
  id: string;
  workspace_id: string;
  content_piece_id: string;
  objective: string | null;
  target_audience: string | null;
  key_messages: string[];
  ref_links: BriefingReference[];       // renamed from 'references' (reserved word)
  ephemerides: string[];
  client_restrictions: string | null;
  ai_suggestions: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
}

export interface BriefingReference {
  url: string;
  description: string;
  thumbnail?: string;
}

export interface Idea {
  id: string;
  workspace_id: string;
  content_piece_id: string;
  title: string | null;
  concept: string | null;
  visual_direction: string | null;
  copy_draft: string | null;
  moodboard_urls: string[];
  status: IdeaStatus;
  ai_generated: boolean;
  created_by: string | null;
  approved_by: string | null;
  created_at: string;
}

export interface Asset {
  id: string;
  workspace_id: string;
  content_piece_id: string | null;
  file_name: string | null;
  file_url: string;
  file_type: "image" | "video" | "design_file";
  mime_type: string | null;
  file_size_bytes: number | null;
  dimensions: { width: number; height: number } | null;
  duration_seconds: number | null;
  version: number;
  is_final: boolean;
  google_drive_file_id: string | null;
  ai_generation_source: AIGenerationSource | null;
  ai_prompt: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ProductionTask {
  id: string;
  workspace_id: string;
  content_piece_id: string;
  assigned_to: string | null;
  task_type: "video_edit" | "graphic_design" | "format_adaptation";
  description: string | null;
  specs: {
    format: string;
    dimensions: string;
    duration?: string;
    platform: Platform;
  } | null;
  deadline: string | null;
  status: "pending" | "in_progress" | "review" | "done";
  created_at: string;
}

export interface Review {
  id: string;
  workspace_id: string;
  content_piece_id: string;
  reviewer_id: string | null;
  review_type: "internal" | "client";
  status: ReviewStatus;
  round: number;
  created_at: string;
}

export interface Comment {
  id: string;
  workspace_id: string;
  content_piece_id: string;
  review_id: string | null;
  author_id: string | null;
  comment_text: string | null;
  comment_type: CommentType;
  annotation_data: Record<string, unknown> | null;
  resolved: boolean;
  created_at: string;
  // Relations
  author?: Profile;
}

export interface Presentation {
  id: string;
  workspace_id: string;
  client_id: string;
  month_year: string | null;
  google_slides_id: string | null;
  google_slides_url: string | null;
  status: "draft" | "shared" | "approved";
  generated_at: string | null;
  shared_with: string[];
  created_at: string;
}

export interface AIPrompt {
  id: string;
  workspace_id: string;
  content_piece_id: string | null;
  prompt_type: "copy" | "image_prompt" | "video_prompt" | "briefing";
  provider: "gemini" | "higgsfield";
  prompt: string;
  system_instruction: string | null;
  result_text: string | null;
  parameters: Record<string, unknown> | null;
  is_favorite: boolean;
  created_by: string | null;
  created_at: string;
}

// =============================================
// v1.5 — New tables (multi-tenant / batches / portal / activity)
// =============================================

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceSettings {
  workspace_id: string;
  agency_name: string | null;
  tagline: string | null;
  logo_url: string | null;
  timezone: string;
  notification_prefs: {
    notif_status?: boolean;
    notif_review?: boolean;
    [key: string]: unknown;
  };
  branding: Record<string, unknown>;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  invited_by: string | null;
  joined_at: string;
}

export interface ClientContact {
  id: string;
  workspace_id: string;
  client_id: string;
  user_id: string | null; // null until invite accepted
  email: string;
  full_name: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface ClientGem {
  id: string;
  workspace_id: string;
  client_id: string;
  name: string;
  system_instruction: string;
  model: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortalInvite {
  id: string;
  workspace_id: string;
  batch_id: string;
  client_contact_id: string;
  token_hash: string;
  status: InviteStatus;
  expires_at: string;
  accepted_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ReviewBatch {
  id: string;
  workspace_id: string;
  client_id: string;
  title: string;
  description: string | null;
  status: BatchStatus;
  sent_at: string | null;
  due_date: string | null;
  approved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewBatchItem {
  id: string;
  batch_id: string;
  content_piece_id: string;
  order_index: number;
  item_status: BatchStatus;
  client_decision: ClientDecision | null;
  client_feedback: string | null;
  decided_at: string | null;
}

export interface BatchComment {
  id: string;
  batch_id: string;
  batch_item_id: string | null;
  author_user_id: string | null;
  author_contact_id: string | null;
  comment_text: string;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  workspace_id: string;
  event_type: ActivityEventType;
  actor_user_id: string | null;
  actor_contact_id: string | null;
  client_id: string | null;
  content_piece_id: string | null;
  batch_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
