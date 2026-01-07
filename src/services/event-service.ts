import * as challengeHandlers from "../handlers/challenge.0.handlers";
import * as challengeTemplateHandlers from "../handlers/challenge.template.0.handlers";
import * as clubHandlers from "../handlers/club.0.handlers";
import * as runHandlers from "../handlers/run.0.handlers";
import * as userHandlers from "../handlers/user.0.handlers";

type FlowcoreEvent = {
  eventId: string;
  flowTypeName: string;
  eventTypeName: string;
  payload: unknown;
  timeBucket: string;
  createdAt: string;
};

/**
 * Route event to appropriate handler
 */
export async function processEvent(
  event: FlowcoreEvent,
  flowTypeName: string,
  eventTypeName: string
) {
  try {
    switch (`${flowTypeName}/${eventTypeName}`) {
      // Run events
      case "run.0/run.logged.0":
        await runHandlers.handleRunLogged(event.payload, event.eventId);
        break;
      case "run.0/run.updated.0":
        await runHandlers.handleRunUpdated(event.payload, event.eventId);
        break;
      case "run.0/run.deleted.0":
        await runHandlers.handleRunDeleted(event.payload, event.eventId);
        break;

      // Challenge events
      case "challenge.0/challenge.started.0":
        await challengeHandlers.handleChallengeStarted(event.payload, event.eventId);
        break;
      case "challenge.0/challenge.updated.0":
        await challengeHandlers.handleChallengeUpdated(event.payload, event.eventId);
        break;
      case "challenge.0/challenge.completed.0":
        await challengeHandlers.handleChallengeCompleted(event.payload, event.eventId);
        break;

      // Challenge template events
      case "challenge.template.0/challenge.template.created.0":
        await challengeTemplateHandlers.handleChallengeTemplateCreated(
          event.payload,
          event.eventId
        );
        break;
      case "challenge.template.0/challenge.template.updated.0":
        await challengeTemplateHandlers.handleChallengeTemplateUpdated(
          event.payload,
          event.eventId
        );
        break;
      case "challenge.template.0/challenge.template.deleted.0":
        await challengeTemplateHandlers.handleChallengeTemplateDeleted(
          event.payload,
          event.eventId
        );
        break;

      // Club events
      case "club.0/club.created.0":
        await clubHandlers.handleClubCreated(event.payload, event.eventId);
        break;
      case "club.0/club.updated.0":
        await clubHandlers.handleClubUpdated(event.payload, event.eventId);
        break;
      case "club.0/club.member.joined.0":
        await clubHandlers.handleClubMemberJoined(event.payload, event.eventId);
        break;
      case "club.0/club.member.left.0":
        await clubHandlers.handleClubMemberLeft(event.payload, event.eventId);
        break;

      // User events
      case "user.0/user.created.0":
        await userHandlers.handleUserCreated(event.payload, event.eventId);
        break;
      case "user.0/user.updated.0":
        await userHandlers.handleUserUpdated(event.payload, event.eventId);
        break;

      default:
        console.warn(`⚠️  Unhandled event type: ${flowTypeName}/${eventTypeName}`);
    }
  } catch (error) {
    console.error(
      `❌ Error processing event ${event.eventId} (${flowTypeName}/${eventTypeName}):`,
      error
    );
    throw error;
  }
}
