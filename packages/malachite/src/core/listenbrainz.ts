import type { ListenBrainzRecord, PlayRecord } from './types.js';
import { RECORD_TYPE } from './config.js';

/**
 * Convert a ListenBrainz record to an ATProto play record.
 *
 * @param clientAgent  The `submissionClientAgent` string for this runtime.
 */
export function convertListenBrainzToPlayRecord(r: ListenBrainzRecord, clientAgent: string): PlayRecord {
    // Seems that all listens mainly use mbid_mapping. Someone should update the official docs!
    // UPDATE: Unlinked listens do not have this. A handful of listens are unlinked as MusicBrainz is yet imcomplete. (forever)
    let artists: PlayRecord['artists'];
    let releaseMbId = undefined;
    let recordingMbId = undefined;
    const { track_name: trackName, release_name: releaseName, artist_name: artist } = r.track_metadata;
    if (r.track_metadata.mbid_mapping) {
        const { recording_mbid, release_mbid, artists: _artists } = r.track_metadata.mbid_mapping!;
        artists = _artists!.map( a => ({ artistName: a.artist_credit_name, artistMbid: a.artist_mbid }) );
        recordingMbId = recording_mbid, releaseMbId = release_mbid;
    } else {
        artists = [{ artistName: artist }];
    }
    const { music_service, origin_url } = r.track_metadata.additional_info!;

    const record: PlayRecord = {
        $type: RECORD_TYPE,
        artists, trackName, releaseName,
        playedTime: new Date(r.listened_at * 1000).toISOString(),
        submissionClientAgent: clientAgent,
        musicServiceBaseDomain: music_service || 'local',
        originUrl: origin_url || '',
    };
    if (releaseMbId) record.releaseMbId = `mbid:${releaseMbId}`;
    if (recordingMbId) record.recordingMbId = `mbid:${recordingMbId}`;

    return record;
}

/**
 * Check if the object is actually a ListenBrainz listen record. Browser-safe.
 * 
 * @remarks Not too comprihensive and only really used to filter out other types of records in an export.
 */
export function isListenBrainzListen(predicate: object): predicate is ListenBrainzRecord {
    if (!Object.hasOwn(predicate, 'listened_at')) return false;
    if (!Object.hasOwn(predicate, 'track_metadata')) return false;

    if (!Object.hasOwn((predicate as ListenBrainzRecord).track_metadata, 'artist_name')) return false;
    if (!Object.hasOwn((predicate as ListenBrainzRecord).track_metadata, 'track_name')) return false;

    return true;
}
