module Main exposing (..)

import Browser
import Browser.Dom as Dom
import Browser.Events as Events
import Dict exposing (Dict)
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Json.Decode as JD
import Json.Encode as JE
import Math.Vector2 as Vec2


main : Program Flags Model Msg
main =
    Browser.document
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }


type alias Flags =
    { x : Float, y : Float }


type Mouse
    = OffScreen
    | OnScreen Bool Vec2.Vec2


type Model
    = NoShape Mouse
    | AShape Mouse Shape


type Shape
    = Segments (List Segment)


type Segment
    = Move Vec2.Vec2
    | Line Vec2.Vec2


type Msg
    = MouseDown Mouse
    | MouseUp Mouse
    | MouseMove Mouse


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( NoShape OffScreen, Cmd.none )



-- MODEL


subscriptions : Model -> Sub Msg
subscriptions model =
    case model of
        NoShape _ ->
            Sub.batch [ Events.onMouseDown (JD.map MouseMove decodeMouse) ]

        AShape _ _ ->
            Sub.batch
                [ Events.onMouseDown (JD.map MouseMove decodeMouse)
                , Events.onMouseUp (JD.map MouseMove decodeMouse)
                , Events.onMouseMove (JD.map MouseMove decodeMouse)
                ]



--port store : JE.Value -> Cmd msg
-- UPDATE


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case ( model, msg ) of
        ( NoShape _, MouseDown mouse ) ->
            case mouse of
                -- Create a move segment at mouse coords when clicked
                OnScreen down coords ->
                    ( AShape mouse (Segments [ Move coords ]), Cmd.none )

                OffScreen ->
                    ( model, Cmd.none )

        ( NoShape _, MouseUp _ ) ->
            ( model, Cmd.none )

        ( NoShape _, MouseMove _ ) ->
            ( model, Cmd.none )

        ( AShape mouse (Segments segments), MouseDown newMouse ) ->
            case mouse of
                OnScreen down coords ->
                    ( AShape newMouse (Segments segments), Cmd.none )

                OffScreen ->
                    ( model, Cmd.none )

        ( AShape mouse (Segments segments), MouseUp newMouse ) ->
            case mouse of
                OnScreen down coords ->
                    ( AShape newMouse (Segments (Line coords :: segments)), Cmd.none )

                OffScreen ->
                    ( model, Cmd.none )

        ( AShape mouse shape, MouseMove newMouse ) ->
            ( model, Cmd.none )



-- VIEW


view : Model -> Browser.Document Msg
view model =
    { title = "", body = [ canvas [ Html.Attributes.id "canvas" ] [] ] }


encodeVec2 : Vec2.Vec2 -> JE.Value
encodeVec2 vec2 =
    JE.object [ ( "x", JE.float (Vec2.getX vec2) ), ( "y", JE.float (Vec2.getX vec2) ) ]


encodeSegment : Segment -> JE.Value
encodeSegment segment =
    case segment of
        Move coords ->
            JE.object [ ( "type", JE.string "move" ), ( "coords", encodeVec2 coords ) ]

        Line coords ->
            JE.object [ ( "type", JE.string "move" ), ( "coords", encodeVec2 coords ) ]


encodeShape : Shape -> JE.Value
encodeShape (Segments segments) =
    JE.list encodeSegment segments


decodeMouse : JD.Decoder Mouse
decodeMouse =
    JD.map2 OnScreen
        decodeButtons
        (JD.map2
            Vec2.vec2
            (JD.field "pageX" JD.float)
            (JD.field "pageY" JD.float)
        )



{- What happens when the user is dragging, but the "mouse up" occurs outside
   the browser window? We need to stop listening for mouse movement and end the
   drag. We use MouseEvent.buttons to detect this:
       https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
   The "buttons" value is 1 when "left-click" is pressed, so we use that to
   detect zombie drags.
-}


decodeButtons : JD.Decoder Bool
decodeButtons =
    JD.field "buttons" (JD.map (\buttons -> buttons == 1) JD.int)
